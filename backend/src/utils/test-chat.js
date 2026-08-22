import "dotenv/config";

import { answerQuestion } from "../services/chat.service.js";

/*
 * Service-level walk through the RAG chat flow. Runs without the HTTP
 * server, so it exercises retrieval + context + LLM only — route
 * validation and auth are covered by the endpoint tests.
 */
const cases = [
  {
    name: "Knowledge question",
    message: "What technologies are used in ShipBihar?",
  },
  {
    name: "Unknown question (must refuse, not invent)",
    message:
      "What is the company's official mascot's middle name and birthday?",
  },
  {
    name: "Empty message (expect 400)",
    message: "   ",
    expectError: true,
  },
];

const run = async () => {
  for (const testCase of cases) {
    console.log(`\n========== ${testCase.name} ==========`);
    console.log("Question:", testCase.message);

    try {
      const result = await answerQuestion({ message: testCase.message });

      if (testCase.expectError) {
        console.error("Expected an error, got an answer ❌");
        continue;
      }

      console.log("\nAnswer:\n" + result.answer);
      console.log("\nContext found:", result.contextFound);
      console.log("Sources:", JSON.stringify(result.sources, null, 2));
      console.log("\nPassed ✅");
    } catch (error) {
      if (testCase.expectError) {
        console.log(
          `Rejected with ${error.statusCode}: ${error.message} ✅`
        );
        continue;
      }

      console.error("Failed ❌");
      console.error(error.message);
    }
  }

  console.log("\n========================================\n");
};

run();
