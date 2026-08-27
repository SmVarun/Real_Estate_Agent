# Keystone CRM — Frontend

React 19 + Vite + Tailwind. Talks to the Express backend in `../backend`.

---

## Running it

The frontend needs the backend running first — it has no mock data and
no offline mode, so every screen is empty or errors without an API.

```bash
# 1. Backend (from ../backend, in its own terminal)
npm install
npm run dev            # http://localhost:3000

# 2. Frontend (from here)
npm install
npm run dev            # http://localhost:5173
```

Then open http://localhost:5173 and sign in, or create an account at
`/signup`.

### The port matters

The backend's CORS is configured from its `FRONTEND_URL`, and cookie
auth cannot use a wildcard origin. If Vite falls back to another port
because 5173 is taken, every request will fail CORS. Either free the
port or set `FRONTEND_URL` in `../backend/.env` to match.

### Optional services

Two features degrade gracefully rather than breaking the app:

| Service   | Needed for                         | Without it                                    |
| --------- | ---------------------------------- | --------------------------------------------- |
| ChromaDB  | Document ingestion, chat retrieval | Chat returns a 503, shown as an error          |
| Local LLM | Generating chat answers            | Chat returns a 503, shown as an error          |
| S3        | Document upload                    | Upload fails with the backend's message        |

```bash
docker run -d --name chroma -p 8000:8000 -v chroma-data:/data chromadb/chroma
```

The LLM endpoint is whatever `OLLAMA_BASE_URL` points at in the
backend's `.env` — Ollama on `:11434` or LM Studio on `:1234`.

---

## Configuration

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000
```

That is the only variable. **Everything prefixed `VITE_` is inlined into
the browser bundle**, so never put a secret, token, or database URL
here.

---

## How it is wired

```
React pages/components
        ↓  useAuth() / useCrm()
   context/  (AuthContext, CrmContext)
        ↓
   api/      (auth, users, company, documents, leads, chat)
        ↓  api/client.js  — credentials: "include"
   Express backend
```

### `src/api/`

`client.js` is the only place that calls `fetch`. It prefixes the base
URL, sends cookies, handles JSON and FormData, and turns every failure —
including a dead server — into an `ApiError` with a readable `message`,
a `status`, and per-field `fieldErrors` for the backend's Zod 400s.

`normalize.js` adapts Mongo documents to the shapes the components were
written against: `_id` becomes `id`, and a populated `assignedTo` is
flattened back to an id plus an `assignee` object.

### Authentication

Cookie-based, `httpOnly`. **No token is ever stored in `localStorage`** —
it could not be read back anyway, and storing one would defeat the
point. The consequence is that "am I signed in?" can only be answered by
the server, which is what `AuthContext` asks on startup via
`GET /users/me`.

Routing guards live in `src/routes/`:

- `ProtectedRoute` — the single auth check for the whole CRM
- `PublicOnlyRoute` — keeps a signed-in user off `/login` and `/signup`
- `AdminRoute` — Company and Knowledge Base are admin-only on the
  backend, so this explains that instead of firing doomed requests

---

## What is real, and what is not

Every screen reads from the backend. Where an endpoint does not exist,
the UI says so rather than inventing data.

| Area                    | Status                                                |
| ----------------------- | ----------------------------------------------------- |
| Auth, leads, users      | Fully integrated                                      |
| Company, documents, RAG | Fully integrated (admin-only for the first two)       |
| Chat history            | **Session-only** — the backend stores no conversations |
| Profile editing         | No endpoint; the form is read-only and says why       |
| Notification / theme    | No endpoint; shown disabled, marked "not available"    |
| Dashboard trends        | No history in the backend; no % badges are shown       |

There is no `mockData.js`. If a list is empty, the database is empty.

---

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # serve the built output
npm run lint      # oxlint
```
