import "dotenv/config";

import { retrieveRelevantChunks } from "../services/rag-retrieval.service.js";

const test = async () => {
  try {
    const query =
      "What technologies were used to build ShipBihar?";

    const results = await retrieveRelevantChunks({
      query,
      topK: 5,
    });

    console.log("\n========== RETRIEVAL RESULTS ==========\n");

    console.log("Query:", query);
    console.log("Results:", results.length);

    results.forEach((result, index) => {
      console.log(`\n---------- RESULT ${index + 1} ----------`);

      console.log("Distance:", result.distance);

      console.log("Metadata:");
      console.log(result.metadata);

      console.log("\nText:");
      console.log(result.text);
    });

    console.log("\n========================================\n");
  } catch (error) {
    console.error("RAG retrieval failed ❌");
    console.error(error);
  }

  process.exit(0);
};

test();