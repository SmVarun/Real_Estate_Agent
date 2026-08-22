# Document API Documentation

**API Version:** v1
**Base URL:** `http://localhost:3000/api/v1`
**Authentication:** httpOnly `accessToken` cookie
**Authorization:** ADMIN only

---

# Overview

The Document API is the ingestion entry point for the knowledge base. It uploads files to **Amazon S3** and keeps only metadata in MongoDB — the file bytes never live in the database, and no file is ever written to the API server's disk.

Each uploaded document is created with `ingestionStatus: "PENDING"`. Nothing in the current codebase advances it past `PENDING`; the parsing/embedding pipeline described in `docs/ingestion.md` and `docs/rag.md` has **not** been built yet. Treat the status field as a placeholder the pipeline will drive later.

Mounted in `backend/src/app.js` via `app.use("/api/v1/documents", documentRoutes)`.

---

# Authentication

Authentication is cookie-based. The browser sends the `accessToken` cookie automatically, provided the request is made with credentials enabled:

```js
fetch("/api/v1/documents", { credentials: "include" })
```

There is no `Authorization` header in this API. See `auth-api.md` for the full flow.

---

# Authorization

Every route in this module is admin-only. `document.routes.js` applies both guards to the whole router:

```js
router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN));
```

| Caller | Access |
|---|---|
| Unauthenticated | ❌ `401 Authentication required` |
| Authenticated `sales_rep` / `manager` | ❌ `403 You do not have permission to perform this action` |
| `admin` | ✅ |

> The canonical role value stored in MongoDB is `admin` (lowercase).
>
> `/register` never accepts a `role`. Every account starts on `sales_rep`. Grant admin with either
> `PATCH /api/v1/users/:id/role` (admin-only) or, for the first admin,
> `node scripts/promote-user.js <email> admin`.

---

# Endpoints

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/api/v1/documents` | Cookie | ADMIN | Upload a file to S3 and record its metadata |
| GET | `/api/v1/documents` | Cookie | ADMIN | List all documents, newest first |
| GET | `/api/v1/documents/:id` | Cookie | ADMIN | Fetch one document's metadata |
| DELETE | `/api/v1/documents/:id` | Cookie | ADMIN | Delete from S3 and MongoDB |

---

## 1. POST /api/v1/documents

### Purpose

Uploads a single file to S3 and creates the matching `Document` record.

### Request

This endpoint is **`multipart/form-data`**, not JSON. Do not set `Content-Type` by hand — let the browser set it so the multipart boundary is generated correctly.

```http
POST /api/v1/documents
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | Yes | The field name must be exactly `file` — `upload.single("file")` |

```js
const body = new FormData();
body.append("file", selectedFile);

await fetch("/api/v1/documents", {
  method: "POST",
  credentials: "include",
  body,
});
```

### Upload constraints

Enforced by `backend/src/middleware/upload.middleware.js` before the handler runs:

| Constraint | Value |
|---|---|
| Max file size | **10 MB** |
| Files per request | 1 |
| Storage | `multer.memoryStorage()` — the file is buffered in RAM and streamed to S3, never written to disk |

Accepted MIME types:

| Type | Extension |
|---|---|
| `application/pdf` | `.pdf` |
| `text/plain` | `.txt` |
| `application/msword` | `.doc` |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.docx` |
| `application/vnd.ms-excel` | `.xls` |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` |

The filter reads the browser-supplied MIME type, not the file's contents, so it is an input-shaping convenience rather than a security control.

### Successful Response — `201 Created`

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "_id": "6a865e9b821199ced3954dcb",
    "originalName": "Q3-pricing.pdf",
    "fileName": "88739135-706f-4815-9e90-911d56c2b6c7-Q3-pricing.pdf",
    "mimeType": "application/pdf",
    "size": 547899,
    "s3Key": "documents/6a865cc65aa4d9bea2f96f2a/88739135-706f-4815-9e90-911d56c2b6c7-Q3-pricing.pdf",
    "s3Bucket": "ai-sales-crm-documents-2026",
    "uploadedBy": "6a865cc65aa4d9bea2f96f2a",
    "ingestionStatus": "PENDING",
    "ingestionError": null,
    "createdAt": "2026-08-20T01:55:39.380Z",
    "updatedAt": "2026-08-20T01:55:39.380Z"
  }
}
```

Note this response returns the **raw created document**, so `uploadedBy` is an id string here. The two GET endpoints populate it into an object instead — see [§4](#4-the-document-model).

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | No `file` field in the request | `"File is required"` |
| 401 | No `accessToken` cookie | `"Authentication required"` |
| 403 | Authenticated but not `admin` | `"You do not have permission to perform this action"` |
| 500 | Disallowed MIME type | `"Invalid file type. Only PDF, TXT, DOC, DOCX, XLS, and XLSX files are allowed."` |
| 500 | File exceeds 10 MB | `"File too large"` |
| 500 | S3 rejected the upload | AWS SDK error message |

> **Known rough edge.** Multer's own errors — wrong type, oversized file — are thrown without a `statusCode`, so the global error handler in `app.js` falls through to its `500` default. These are client mistakes and should surface as `400`/`413`. The fix is a small multer-aware branch in the error handler; until then the frontend has to match on the message text to tell a rejected upload from a genuine server fault.

### S3 key layout

```
documents/<uploaderUserId>/<uuid>-<sanitized-basename><ext>
```

The basename is sanitized to `[a-zA-Z0-9-_]` and prefixed with a `crypto.randomUUID()`, so two uploads of the same filename never collide and a crafted filename cannot escape its prefix. `originalName` keeps the untouched name for display.

### Failure handling

The write is ordered S3-first, MongoDB-second. If the metadata insert fails after the object has landed in S3, the service deletes the orphaned object before rethrowing. A failure of that cleanup is logged and swallowed so the original error is what reaches the client.

The reverse gap is not covered: an S3 object can outlive its record if the process dies between the two calls. A periodic reconciliation sweep would be the standard fix.

---

## 2. GET /api/v1/documents

### Purpose

Lists every document, newest first (`createdAt: -1`).

### Request

```http
GET /api/v1/documents
```

No query parameters. There is **no pagination, filtering, or search** — the endpoint returns the entire collection on every call. Worth adding before the collection grows.

### Successful Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "6a865e9b821199ced3954dcb",
      "originalName": "Q3-pricing.pdf",
      "fileName": "88739135-706f-4815-9e90-911d56c2b6c7-Q3-pricing.pdf",
      "mimeType": "application/pdf",
      "size": 547899,
      "s3Key": "documents/6a865cc65aa4d9bea2f96f2a/88739135-...-Q3-pricing.pdf",
      "s3Bucket": "ai-sales-crm-documents-2026",
      "uploadedBy": {
        "_id": "6a865cc65aa4d9bea2f96f2a",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "admin"
      },
      "ingestionStatus": "PENDING",
      "ingestionError": null,
      "createdAt": "2026-08-20T01:55:39.380Z",
      "updatedAt": "2026-08-20T01:55:39.380Z"
    }
  ]
}
```

Note there is no `message` key on this response or on `GET /:id` — only `success` and `data`. The other modules always include one; if the frontend reads `message` unconditionally it will get `undefined` here.

`uploadedBy` is populated with `username`, `email`, and `role`. It comes back as **`null`** when the referencing user has since been deleted — Mongoose populate resolves a dangling reference to null rather than erroring. Render defensively.

### Error Responses

| Status | Condition |
|---|---|
| 401 | No `accessToken` cookie |
| 403 | Authenticated but not `admin` |
| 500 | Unexpected server error |

---

## 3. GET /api/v1/documents/:id

### Purpose

Fetches one document's metadata, with `uploadedBy` populated exactly as in the list endpoint.

### Request

```http
GET /api/v1/documents/6a865e9b821199ced3954dcb
```

### Successful Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "6a865e9b821199ced3954dcb",
    "originalName": "Q3-pricing.pdf",
    "mimeType": "application/pdf",
    "size": 547899,
    "s3Key": "documents/6a865cc65aa4d9bea2f96f2a/88739135-...-Q3-pricing.pdf",
    "s3Bucket": "ai-sales-crm-documents-2026",
    "uploadedBy": {
      "_id": "6a865cc65aa4d9bea2f96f2a",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "admin"
    },
    "ingestionStatus": "PENDING",
    "ingestionError": null,
    "createdAt": "2026-08-20T01:55:39.380Z",
    "updatedAt": "2026-08-20T01:55:39.380Z"
  }
}
```

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 401 | No `accessToken` cookie | `"Authentication required"` |
| 403 | Authenticated but not `admin` | `"You do not have permission to perform this action"` |
| 404 | No document with that id | `"Document not found"` |
| 500 | `:id` is not a valid ObjectId | Mongoose `CastError` message |

> A malformed id produces a `CastError` with no `statusCode`, so it surfaces as `500` rather than `400`. Same root cause as the multer note above — the global error handler does not special-case it.

### This endpoint does not return the file

There is no download endpoint and no presigned-URL endpoint. `s3Key` and `s3Bucket` are exposed, but the bucket is not public, so a client cannot fetch the object with them. Serving a file to the browser needs a new route that issues a `GetObjectCommand` presigned URL — that is the intended shape, and it does not exist yet.

---

## 4. DELETE /api/v1/documents/:id

### Purpose

Permanently deletes the S3 object and then the MongoDB record.

### Request

```http
DELETE /api/v1/documents/6a865e9b821199ced3954dcb
```

### Successful Response — `200 OK`

```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

No `data` key is returned. The service does return the deleted document internally, but the controller discards it.

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 401 | No `accessToken` cookie | `"Authentication required"` |
| 403 | Authenticated but not `admin` | `"You do not have permission to perform this action"` |
| 404 | No document with that id | `"Document not found"` |
| 500 | S3 delete failed | AWS SDK error message |

### Ordering

S3 is deleted first; the MongoDB record is removed only if that succeeds. So a failed S3 delete leaves the record intact and the operation is safe to retry — the failure mode is a stale record, never a record pointing at a file that is already gone.

This is a hard delete with no confirmation step and no soft-delete flag. Once `deleteDocument` returns, the file is unrecoverable unless the bucket has versioning enabled.

---

## 5. The Document Model

`backend/src/models/document.model.js`, collection `documents`.

| Field | Type | Notes |
|---|---|---|
| `originalName` | String, required, trimmed | Filename as the user uploaded it — use this for display |
| `fileName` | String, required, trimmed | The generated `<uuid>-<sanitized>` name; the last segment of `s3Key` |
| `mimeType` | String, required | Browser-reported type, validated against the allow-list |
| `size` | Number, required | Bytes |
| `s3Key` | String, required, **unique** | Full object key within the bucket |
| `s3Bucket` | String, required | Captured per document, so a bucket migration doesn't orphan old rows |
| `uploadedBy` | ObjectId → `User`, required | Populated on both GETs; `null` if that user was deleted |
| `ingestionStatus` | String enum, default `"PENDING"` | `PENDING` \| `PROCESSING` \| `COMPLETED` \| `FAILED` |
| `ingestionError` | String, default `null` | Reserved for the pipeline's failure reason |
| `createdAt` / `updatedAt` | Date | From `timestamps: true` |

`ingestionStatus` and `ingestionError` are written once at creation and never updated by any code in the repository today.

---

## 6. Configuration

The S3 client (`backend/src/config/s3.js`) is built from four environment variables. All four are in the required list in `config.js`, so the process **exits on boot** if any is missing.

| Variable | Purpose |
|---|---|
| `AWS_S3_BUCKET_NAME` | Target bucket for all uploads |
| `AWS_REGION` | Bucket's region |
| `AWS_BUCKET_ACCESS_KEY` | IAM access key id |
| `AWS_BUCKET_SECRET_KEY` | IAM secret access key |

The IAM principal needs `s3:PutObject`, `s3:DeleteObject`, and — once a download route exists — `s3:GetObject`, scoped to `arn:aws:s3:::<bucket>/documents/*`.

---

## 7. Not implemented yet

Do not build UI against these; none of them exist:

- **Download / preview** — no presigned-URL or streaming endpoint (see [§3](#3-get-apiv1documentsid)).
- **Ingestion pipeline** — nothing parses, chunks, or embeds an uploaded file. `ingestionStatus` never leaves `PENDING`.
- **Pagination, filtering, search** — `GET /` returns the whole collection.
- **Update / rename** — there is no `PATCH`. Correcting a name means delete and re-upload.
- **Multi-file upload** — `upload.single("file")` accepts exactly one file per request.
- **Per-user scoping** — any admin sees and can delete every document regardless of who uploaded it. `uploadedBy` is recorded for attribution only; it is never used as a filter or an ownership check.
- **Virus scanning / content-based type verification** — the MIME allow-list trusts the client's declared type.
