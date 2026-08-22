import { ChromaClient } from "chromadb";

// chromadb v3 deprecated the single `path` option in favour of discrete
// host/port/ssl. CHROMA_URL stays the one thing to configure — it is split
// here so a deployed https URL keeps working without extra env vars.
const url = new URL(
  process.env.CHROMA_URL || "http://localhost:8000"
);

const ssl = url.protocol === "https:";

const chromaClient = new ChromaClient({
  host: url.hostname,
  port: Number(url.port) || (ssl ? 443 : 8000),
  ssl,
});

export default chromaClient;
