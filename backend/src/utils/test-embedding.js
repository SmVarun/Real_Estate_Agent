import "dotenv/config";

import { generateEmbedding } from "../services/embedding.service.js";

const test = async () => {
  try {
    const text = `
      ShipBihar is a logistics and courier aggregation backend
      built using Node.js, Express.js, MongoDB, Redis and RabbitMQ.
    `;

    const embedding = await generateEmbedding(text);

    console.log("Embedding generated successfully ✅");
    console.log("Embedding dimensions:", embedding.length);
    console.log("First values:", embedding.slice(0, 5));
  } catch (error) {
    console.error("Embedding generation failed ❌");
    console.error(error);
  }
};

test();