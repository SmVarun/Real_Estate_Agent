import { getCollection } from "./chroma.service.js";
import { generateEmbedding } from "./embedding.service.js";

export const DEFAULT_TOP_K = 5;
export const MAX_TOP_K = 10;

/*
 * Chroma and Hugging Face both raise errors that name hosts, env vars
 * and vendor config flags. Those are useful in the server log and
 * nowhere else, so every infrastructure failure leaves here as the
 * same opaque 503.
 */
const retrievalUnavailable = (stage, reason) => {
  console.error(`[RAG] ${stage} failed:`, reason?.message || reason);

  const error = new Error(
    "The knowledge base is temporarily unavailable. Please try again in a moment."
  );

  error.statusCode = 503;
  error.cause = reason;

  return error;
};

// Our own 4xx (an empty query, a bad argument) are already safe to
// show and must not be flattened into a 503.
const isClientError = (error) =>
  typeof error?.statusCode === "number" && error.statusCode < 500;

/*
 * Retrieval half of the RAG pipeline: question -> embedding -> nearest
 * chunks. Deliberately dumb about prompts and about the LLM — it only
 * finds text.
 *
 * documentId is an optional scope for "ask about THIS file" style
 * callers. It is not tenancy: this CRM serves one company and the
 * collection is never partitioned by owner.
 */
export const retrieveRelevantChunks = async ({
  query,
  topK = DEFAULT_TOP_K,
  documentId = null,
}) => {
  if (!query?.trim()) {
    const error = new Error("Query is required");
    error.statusCode = 400;
    throw error;
  }

  // Clamped rather than trusted: nResults is a database cost, and the
  // route validator is not the only caller.
  const limit = Math.min(
    Math.max(Number(topK) || DEFAULT_TOP_K, 1),
    MAX_TOP_K
  );

  let collection;

  try {
    collection = await getCollection();
  } catch (error) {
    throw retrievalUnavailable("chroma connection", error);
  }

  let queryEmbedding;

  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (error) {
    if (isClientError(error)) {
      throw error;
    }

    throw retrievalUnavailable("embedding generation", error);
  }

  const where = documentId
    ? {
        documentId: documentId.toString(),
      }
    : undefined;

  let results;

  try {
    results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      ...(where && { where }),
    });
  } catch (error) {
    throw retrievalUnavailable("chroma query", error);
  }

  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  return documents.map((text, index) => ({
    text,
    metadata: metadatas[index] || {},
    distance: distances[index] ?? null,
  }));
};
