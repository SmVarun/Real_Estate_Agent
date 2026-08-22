export const chunkText = ({
  text,
  chunkSize = 1000,
  chunkOverlap = 200,
}) => {
  if (!text || !text.trim()) {
    return [];
  }

  const chunks = [];

  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end === text.length) {
      break;
    }

    start = end - chunkOverlap;
  }

  return chunks;
};