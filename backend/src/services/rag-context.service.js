/*
 * Turns raw Chroma hits into (a) a block of text the model can read and
 * (b) the source list the API returns.
 *
 * Strictly a formatter: it never embeds, never queries, never calls the
 * LLM. That keeps the prompt shape changeable without touching any
 * service that talks to infrastructure.
 */

// A budget, not a hard truth about the model's window: it stops one
// oversized document from crowding the question out of the prompt.
const MAX_CONTEXT_CHARACTERS = 12000;

const sourceLabel = (metadata) =>
  metadata?.source || metadata?.originalName || "Unknown document";

export const buildContext = (chunks = []) => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return {
      context: "",
      sources: [],
      usedChunks: 0,
    };
  }

  const blocks = [];
  const sources = [];

  let characters = 0;

  chunks.forEach((chunk) => {
    const text = chunk?.text?.trim();

    if (!text) {
      return;
    }

    const index = blocks.length + 1;
    const label = sourceLabel(chunk.metadata);

    const block = `SOURCE ${index}:\n${label}\n\n${text}`;

    // Drop the chunk entirely rather than truncating mid-sentence —
    // half a fact is worse grounding than one fact fewer.
    if (characters + block.length > MAX_CONTEXT_CHARACTERS) {
      return;
    }

    characters += block.length;

    blocks.push(block);

    /*
     * Only metadata that is useful to a human reading the answer.
     * Distances, embeddings and Chroma ids stay server-side.
     */
    sources.push({
      documentId: chunk.metadata?.documentId ?? null,
      source: label,
      chunkIndex: chunk.metadata?.chunkIndex ?? null,
    });
  });

  return {
    context: blocks.join("\n\n---\n\n"),
    sources,
    usedChunks: blocks.length,
  };
};
