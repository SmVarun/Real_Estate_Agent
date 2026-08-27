import {
  retrieveRelevantChunks,
  DEFAULT_TOP_K,
} from "./rag-retrieval.service.js";

import { buildContext } from "./rag-context.service.js";
import { generateCompletion } from "./ollama.service.js";

import {
  RAG_SYSTEM_PROMPT,
  buildRagPrompt,
  NO_CONTEXT_ANSWER,
} from "../prompts/rag-chat.prompt.js";

/*
 * Orchestrates one turn of RAG chat:
 *
 *   question -> embedding -> Chroma -> context -> prompt -> LLM
 *
 * Single-turn by design. Nothing here is persisted and no history is
 * carried between calls.
 *
 * Knows nothing about req/res — the controller owns HTTP.
 */
export const answerQuestion = async ({ message, topK = DEFAULT_TOP_K }) => {
  const question = message?.trim();

  if (!question) {
    const error = new Error("Message is required");
    error.statusCode = 400;
    throw error;
  }

  // Length only — logging the question itself would put whatever a
  // sales rep typed into the server log.
  console.log(`[CHAT] Query received (${question.length} chars, topK=${topK})`);

  const chunks = await retrieveRelevantChunks({ query: question, topK });

  console.log(`[CHAT] Retrieved ${chunks.length} chunks`);

  const { context, sources, usedChunks } = buildContext(chunks);

  /*
   * Empty knowledge base, or nothing near the question. Returning the
   * fixed refusal is both cheaper and safer than handing the model an
   * empty context and hoping it declines to answer from memory.
   */
  if (!usedChunks) {
    console.log("[CHAT] No relevant context found — skipping LLM call");

    return {
      answer: NO_CONTEXT_ANSWER,
      sources: [],
      contextFound: false,
    };
  }

  const prompt = buildRagPrompt({ context, question });

  console.log(`[CHAT] Calling Ollama with ${usedChunks} sources`);

  const answer = await generateCompletion({
    systemPrompt: RAG_SYSTEM_PROMPT,
    userPrompt: prompt,
  });

  console.log(`[CHAT] Response generated (${answer.length} chars)`);

  return {
    answer,
    sources,
    contextFound: true,
  };
};
