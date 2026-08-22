import Document from "../models/document.model.js";

import { downloadDocumentFromS3 } from "./s3-document.service.js";
import { extractText } from "./document-extractor.js";
import { chunkText } from "./text-chunking.service.js";
import { generateEmbeddings } from "./embedding.service.js";
import { addDocumentChunks } from "./chroma.service.js";

export const INGESTION_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/*
 * S3, Hugging Face and Chroma all raise errors that name buckets, hosts
 * and env vars. Those belong in the server log and nowhere near a
 * persisted field the API hands back, so every 5xx is stored as the
 * stage that failed and nothing more.
 *
 * Our own 4xx (an unsupported mime type, an empty file) are already
 * written for a human and are kept verbatim.
 */
const isClientError = (error) =>
  typeof error?.statusCode === "number" && error.statusCode < 500;

const safeErrorMessage = (stage, error) => {
  if (isClientError(error) && error.message) {
    return error.message.slice(0, 500);
  }

  return `Ingestion failed during ${stage}`;
};

/*
 * The single place ingestion status is written. Every caller in this
 * file goes through it — nothing else in the codebase should be
 * touching ingestionStatus directly.
 */
export const updateIngestionStatus = async (
  documentId,
  status,
  ingestionError = null
) => {
  return Document.findByIdAndUpdate(
    documentId,
    {
      ingestionStatus: status,
      ingestionError,
    },
    { returnDocument: "after" }
  );
};

/*
 * Claims the document for ingestion. Conditional on PENDING, so it is
 * also the guard for the transition rules: a COMPLETED, FAILED or
 * already-PROCESSING document cannot be pulled back into PROCESSING,
 * and two concurrent triggers cannot both win. Re-ingestion is
 * deliberately not supported.
 */
const claimForIngestion = async (documentId) => {
  const claimed = await Document.findOneAndUpdate(
    {
      _id: documentId,
      ingestionStatus: INGESTION_STATUS.PENDING,
    },
    {
      ingestionStatus: INGESTION_STATUS.PROCESSING,
      ingestionError: null,
    },
    { returnDocument: "after" }
  );

  if (claimed) {
    return claimed;
  }

  const existing = await Document.findById(documentId);

  if (!existing) {
    const error = new Error("Document not found");
    error.statusCode = 404;
    throw error;
  }

  const error = new Error(
    `Document is not pending ingestion (current status: ${existing.ingestionStatus})`
  );

  error.statusCode = 409;

  throw error;
};

/*
 * Ingestion half of the RAG pipeline, and the sole owner of the
 * ingestion status lifecycle:
 *
 *   PENDING -> PROCESSING -> COMPLETED
 *   PENDING -> PROCESSING -> FAILED
 *
 * COMPLETED means the chunks are queryable in Chroma — not merely
 * downloaded, extracted or embedded. Every stage before the Chroma
 * write can succeed and the document still ends up FAILED.
 *
 * Knows nothing about req/res; the controller owns HTTP.
 */
export const ingestDocument = async (documentId) => {
  const document = await claimForIngestion(documentId);

  let stage = "startup";

  try {
    console.log(
      `[INGEST] ${documentId} started (${document.originalName})`
    );

    stage = "S3 download";

    const buffer = await downloadDocumentFromS3({
      bucket: document.s3Bucket,
      key: document.s3Key,
    });

    console.log(`[INGEST] ${documentId} downloaded ${buffer.length} bytes`);

    stage = "text extraction";

    const text = await extractText({
      buffer,
      mimeType: document.mimeType,
    });

    stage = "chunking";

    const chunks = chunkText({
      text,
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    // A document that yields nothing is a failed ingestion, not an
    // empty success: it would sit at COMPLETED while contributing
    // nothing to retrieval.
    if (!chunks.length) {
      const error = new Error(
        "No readable text could be extracted from this document"
      );

      error.statusCode = 422;

      throw error;
    }

    console.log(`[INGEST] ${documentId} produced ${chunks.length} chunks`);

    stage = "embedding generation";

    const embeddings = await generateEmbeddings(chunks);

    stage = "chroma insertion";

    const { chunksStored } = await addDocumentChunks({
      documentId: document._id.toString(),
      chunks,
      embeddings,
      metadata: {
        originalName: document.originalName,
        mimeType: document.mimeType,
      },
    });

    // Only now is the document actually usable by RAG chat.
    await updateIngestionStatus(
      document._id,
      INGESTION_STATUS.COMPLETED,
      null
    );

    console.log(
      `[INGEST] ${documentId} COMPLETED (${chunksStored} chunks stored)`
    );

    return {
      documentId: document._id.toString(),
      chunksStored,
      ingestionStatus: INGESTION_STATUS.COMPLETED,
    };
  } catch (error) {
    console.error(`[INGEST] ${documentId} failed at ${stage}:`, error.message);

    await updateIngestionStatus(
      document._id,
      INGESTION_STATUS.FAILED,
      safeErrorMessage(stage, error)
    );

    // Rethrown unchanged so the caller's existing error handling sees
    // the real failure.
    throw error;
  }
};
