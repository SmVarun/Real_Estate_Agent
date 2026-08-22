import "dotenv/config";

import {
  checkConnection,
  generateCompletion,
} from "../services/ollama.service.js";

const test = async () => {
  try {
    const status = await checkConnection();

    console.log("Connection:", status);

    if (!status.reachable) {
      console.error("Ollama is not reachable ❌");
      process.exit(1);
    }

    const answer = await generateCompletion({
      systemPrompt: "You are a terse assistant.",
      userPrompt: "Reply with exactly the word: pong",
    });

    console.log("Model replied:", answer);
    console.log("Ollama connectivity OK ✅");
  } catch (error) {
    console.error("Ollama check failed ❌");
    console.error(error.message);
  }

  process.exit(0);
};

test();
