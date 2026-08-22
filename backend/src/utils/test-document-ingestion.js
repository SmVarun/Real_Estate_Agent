import "dotenv/config";

import connectDatabase from "../config/mongodb.js";
import Document from "../models/document.model.js";
import { getCollection } from "../services/chroma.service.js";
import {
  ingestDocument,
  INGESTION_STATUS,
} from "../services/document-ingestion.service.js";

/*
 * End-to-end check of the ingestion status lifecycle.
 *
 * Success path runs against a REAL pending document (S3 -> extract ->
 * chunk -> Hugging Face -> Chroma) and asserts the status only reaches
 * COMPLETED once the chunks are actually queryable.
 *
 * Failure path uses a throwaway record pointing at a non-existent S3
 * key, so no working configuration is broken to produce it.
 */

const readStatus = async (documentId) => {
  const document = await Document.findById(documentId)
    .select("ingestionStatus ingestionError")
    .lean();

  return document;
};

// ingestDocument is awaited by the caller, so PROCESSING is only
// observable from outside it — poll Mongo while the pipeline runs.
const watchStatuses = (documentId, seen) => {
  let stopped = false;

  const loop = async () => {
    while (!stopped) {
      const current = await readStatus(documentId);

      if (current && !seen.includes(current.ingestionStatus)) {
        seen.push(current.ingestionStatus);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const done = loop();

  return async () => {
    stopped = true;
    await done;
  };
};

const countChunksInChroma = async (documentId) => {
  const collection = await getCollection();

  const result = await collection.get({
    where: { documentId: documentId.toString() },
    include: ["metadatas"],
  });

  return result.ids?.length || 0;
};

const assert = (condition, label) => {
  if (condition) {
    console.log(`  PASS  ${label}`);
    return true;
  }

  console.error(`  FAIL  ${label}`);
  return false;
};

let failures = 0;

const check = (condition, label) => {
  if (!assert(condition, label)) {
    failures += 1;
  }
};

const testSuccessPath = async () => {
  console.log("\n=== SUCCESS PATH ===\n");

  const pending = await Document.findOne({
    ingestionStatus: INGESTION_STATUS.PENDING,
  });

  if (!pending) {
    console.log("  SKIP  no PENDING document available");
    return;
  }

  console.log(`Document: ${pending.originalName} (${pending._id})`);

  const before = await readStatus(pending._id);
  check(
    before.ingestionStatus === INGESTION_STATUS.PENDING,
    "initial status is PENDING"
  );

  const seen = [before.ingestionStatus];
  const stopWatching = watchStatuses(pending._id, seen);

  const result = await ingestDocument(pending._id);

  await stopWatching();

  console.log("Observed transitions:", seen.join(" -> "));

  check(
    seen.includes(INGESTION_STATUS.PROCESSING),
    "status passed through PROCESSING"
  );

  const after = await readStatus(pending._id);

  check(
    after.ingestionStatus === INGESTION_STATUS.COMPLETED,
    "final status is COMPLETED"
  );

  check(after.ingestionError === null, "ingestionError cleared on success");

  const storedChunks = await countChunksInChroma(pending._id);

  console.log(`Chunks in Chroma: ${storedChunks}`);

  check(storedChunks > 0, "chunks are present in ChromaDB");

  check(
    storedChunks === result.chunksStored,
    "ChromaDB chunk count matches what ingestion reported"
  );

  return pending._id;
};

const testFailurePath = async () => {
  console.log("\n=== FAILURE PATH (invalid S3 object) ===\n");

  const broken = await Document.create({
    originalName: "ingestion-failure-test.pdf",
    fileName: "ingestion-failure-test.pdf",
    mimeType: "application/pdf",
    size: 1,
    s3Key: `documents/ingestion-failure-test/${Date.now()}.pdf`,
    s3Bucket: process.env.AWS_S3_BUCKET_NAME,
    uploadedBy: (await Document.findOne().select("uploadedBy").lean())
      .uploadedBy,
    ingestionStatus: INGESTION_STATUS.PENDING,
  });

  console.log(`Document: ${broken.originalName} (${broken._id})`);

  let propagated = null;

  try {
    await ingestDocument(broken._id);
  } catch (error) {
    propagated = error;
  }

  check(propagated !== null, "error was rethrown, not swallowed");

  const after = await readStatus(broken._id);

  check(
    after.ingestionStatus === INGESTION_STATUS.FAILED,
    "final status is FAILED"
  );

  check(
    typeof after.ingestionError === "string" && after.ingestionError.length > 0,
    "ingestionError recorded"
  );

  console.log(`  stored message: "${after.ingestionError}"`);

  check(
    !/AWS|SECRET|KEY=|ACCESS_KEY|amazonaws|\n\s+at /i.test(
      after.ingestionError
    ),
    "stored message leaks no credentials, hosts or stack trace"
  );

  await Document.findByIdAndDelete(broken._id);
  console.log("  cleaned up throwaway record");
};

const testTransitionGuard = async (completedId) => {
  console.log("\n=== TRANSITION GUARD ===\n");

  if (!completedId) {
    console.log("  SKIP  no COMPLETED document from this run");
    return;
  }

  let rejected = null;

  try {
    await ingestDocument(completedId);
  } catch (error) {
    rejected = error;
  }

  check(rejected !== null, "re-ingesting a COMPLETED document is rejected");

  const after = await readStatus(completedId);

  check(
    after.ingestionStatus === INGESTION_STATUS.COMPLETED,
    "COMPLETED -> PROCESSING was not allowed"
  );
};

const run = async () => {
  await connectDatabase();

  const completedId = await testSuccessPath();
  await testFailurePath();
  await testTransitionGuard(completedId);

  console.log(
    failures === 0
      ? "\nAll ingestion lifecycle checks passed\n"
      : `\n${failures} check(s) failed\n`
  );

  process.exit(failures === 0 ? 0 : 1);
};

run();
