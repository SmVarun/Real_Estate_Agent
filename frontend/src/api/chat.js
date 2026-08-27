import { api } from "./client.js";

/*
 * POST /api/v1/chat — the RAG endpoint.
 *
 * Single turn by design: the backend stores no conversation and
 * accepts no history, so there is nothing to pass but the question.
 *
 * Returns { answer, sources, contextFound }. `contextFound: false`
 * means the knowledge base had nothing relevant and `answer` is the
 * backend's own refusal — display it as-is.
 */
export const sendChatMessage = async ({ message, topK, signal } = {}) => {
  const response = await api.post(
    "/api/v1/chat",
    topK ? { message, topK } : { message },
    { signal }
  );

  return response.data;
};
