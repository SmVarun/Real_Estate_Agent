import "dotenv/config";

import { addDocumentChunks } from "../services/chroma.service.js";

const test = async () => {
  try {
    const chunks = [
      "ShipBihar is a logistics and courier aggregation platform.",
      "The backend uses Node.js, Express.js, MongoDB, Redis and RabbitMQ.",
    ];

    // Must match the real embedding model's width. Chroma fixes a
    // collection's dimension on the first insert, so seeding it with a
    // toy 3-value vector would make every genuine 384-dim insert fail
    // afterwards with a dimension mismatch.
    const dimensions = 384;

    const embeddings = chunks.map((_, chunkIndex) =>
      Array.from(
        { length: dimensions },
        (_, index) => (chunkIndex + 1) * 0.01 + index * 0.0001
      )
    );

    // Unique per run: add() rejects ids that already exist, so a fixed id
    // would make the test pass once and fail on every re-run.
    const result = await addDocumentChunks({
      documentId: `test-document-${Date.now()}`,
      chunks,
      embeddings,
      metadata: {
        source: "test",
      },
    });

    console.log("ChromaDB insertion successful ✅");
    console.log(result);
  } catch (error) {
    console.error("ChromaDB insertion failed ❌");
    console.error(error);
  }
};

test();