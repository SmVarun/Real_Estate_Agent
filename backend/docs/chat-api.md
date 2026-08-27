# Chat API (RAG)

Single-turn retrieval-augmented chat over the company knowledge base.
No conversation history, sessions, memory, or streaming — every request
is answered independently.

---

## 1. Flow

```
POST /api/v1/chat
      -> requireAuth (existing access-token cookie)
      -> zod validation (message, topK)
      -> chat.service.js
             -> rag-retrieval.service.js   question -> HF embedding -> Chroma
             -> rag-context.service.js     chunks -> "SOURCE n" context + source list
             -> prompts/rag-chat.prompt.js grounded system + user prompt
             -> ollama.service.js          local LLM
      -> { answer, sources, contextFound }
```

---

## 2. `POST /api/v1/chat`

Requires a valid `accessToken` cookie. Open to **every** authenticated
role — uploading documents is admin-only, reading them is not.

### Request

```json
{ "message": "What products does the company offer?" }
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `message` | string | yes | trimmed, 1–2000 characters |
| `topK` | integer | no | 1–10, default 5 |

`topK` is the only tunable the client is given, and it is clamped again
inside the retrieval service — nothing else about the retrieval or the
model can be driven from the frontend.

### Response — `200`

```json
{
  "success": true,
  "data": {
    "answer": "The company offers ...",
    "sources": [
      { "documentId": "6a89...", "source": "product-catalog.pdf", "chunkIndex": 3 }
    ],
    "contextFound": true
  }
}
```

`sources` lists the chunks that were placed in the prompt. Embeddings,
vector distances and Chroma ids are never returned.

When nothing in the knowledge base is near the question, the LLM is not
called at all and the endpoint answers with `contextFound: false`, an
empty `sources` array, and a fixed message.

### Errors

| Status | When | Body `message` |
|---|---|---|
| 400 | missing/blank `message`, `topK` out of range or not an integer | `Validation failed` + per-field `errors[]` |
| 401 | no or invalid access token | `Authentication required` |
| 503 | ChromaDB unreachable, or embedding generation failed | `The knowledge base is temporarily unavailable...` |
| 503 | local LLM unreachable, timed out, or returned nothing usable | `The AI assistant is temporarily unavailable...` |

Vendor error text (ChromaDB connection advice, Hugging Face key hints,
model-server payloads) is written to the server log and never to the
response.

---

## 3. Configuration

| Variable | Purpose |
|---|---|
| `OLLAMA_BASE_URL` | Base URL of the local model server, scheme + port, no path |
| `OLLAMA_MODEL` | Model tag exactly as the server reports it |
| `OLLAMA_API_STYLE` | `auto` (default), `native`, or `openai` |
| `OLLAMA_TIMEOUT_MS` | Per-generation ceiling, default `120000` |

Retrieval reuses `CHROMA_URL`, `CHROMA_COLLECTION`, `HF_API_KEY`,
`HF_EMBEDDING_MODEL` and `HF_PROVIDER` — the chat flow adds no vector
store or embedding configuration of its own.

### API style

`ollama.service.js` speaks two dialects:

- **native** — Ollama's `POST /api/chat`
- **openai** — `POST /v1/chat/completions`, served by Ollama, LM Studio
  and llama.cpp

On `auto` the style is probed once per process by calling `/api/tags`
and checking that the body contains a `models` array. The body check
matters: LM Studio answers unknown paths with **HTTP 200** and an error
payload, so a status-code-only probe misidentifies it as Ollama.

---

## 4. Prompt

The grounding rules live in `src/prompts/rag-chat.prompt.js` and are
filled in by `chat.service.js` alone. Editing the wording there changes
the assistant's behaviour without touching any service that talks to
infrastructure.

---

## 5. Not implemented

- Conversation history, sessions, memory, message persistence
- Streaming / WebSockets
- Reranking, hybrid or keyword search, relevance thresholds
- Per-user or per-document scoping of results (`retrieveRelevantChunks`
  accepts an optional `documentId`, but the route does not expose it)
