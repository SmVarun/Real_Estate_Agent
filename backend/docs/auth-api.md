# Authentication API — Frontend Integration Guide

This document describes the authentication API **exactly as currently implemented** in the backend (`backend/src/`). It is generated from the real routes, controllers, services, validators, and models in this repository — not from the earlier architecture drafts in `docs/authentication.md` / `docs/api.md`, which describe a larger *planned* system (companies, 2FA, `GET /auth/me`, role-based tenant isolation, etc.) that has **not** been built yet. Where the real implementation diverges from those drafts, this document calls it out explicitly.

Base URL for every endpoint below:

```
/api/v1/auth
```

(Mounted in `backend/src/app.js` via `app.use("/api/v1/auth", router)`.)

---

## 0. Read this before integrating

- **Authentication middleware now exists.** `requireAuth` (`backend/src/middleware/auth.middleware.js`) verifies the `Authorization: Bearer <accessToken>` header on every route under `/api/v1/users`. The `/api/v1/auth/*` routes below remain public by design — they are how you *obtain* a token. Send `Authorization: Bearer <accessToken>` on every `/api/v1/users` call.
- **Roles cannot be self-assigned.** `POST /register` ignores a `role` field in the body — Zod strips it and the account is created as `sales_rep`. This is deliberate: honouring a client-supplied role would let anyone hitting public signup mint an admin. Roles change only through `PATCH /api/v1/users/:id/role`, which is admin-only. See [§12](#12-roles-and-authorization).
- **Authorization reads the database, not the token.** The access token carries a `role` claim, but `requireAuth` ignores it and loads the current user instead. A promotion, demotion, or deactivation therefore takes effect on the *next request* rather than after the ~15-minute token lifetime.
- **Registration logs the user in.** `POST /register` returns the exact same payload as `POST /login` — `{ user, accessToken, refreshToken }` — and creates a server-side session. The frontend must **not** call `/login` after a successful `/register`; store the tokens and go straight to onboarding.
- **There is no email verification.** No verification email is sent, there are no `/verify-email` or `/resend-verification` endpoints, and the `User` model has no `isEmailVerified` field. Register and login are the only two ways into the app.
- **Refresh tokens are rotated on every use.** Each successful `POST /refresh` revokes the refresh token that was just used and returns a brand-new `accessToken`/`refreshToken` pair. The frontend must overwrite its stored `refreshToken` after every refresh call, or the next refresh will fail with 401.
- **`POST /logout` logs out one session only** (the one tied to the `refreshToken` you send). There is no "log out of all devices" endpoint. A successful password reset does revoke all sessions for that user as a side effect of that specific flow.
- All JSON responses share one envelope shape (see [§2](#2-standard-response-envelope)).

---

## 1. Endpoint Index

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create a new user account **and sign them in** |
| POST | `/api/v1/auth/login` | No | Authenticate and receive a token pair |
| POST | `/api/v1/auth/refresh` | No (refresh token in body) | Rotate a refresh token for a new token pair |
| POST | `/api/v1/auth/logout` | No (refresh token in body) | Revoke a single session |
| POST | `/api/v1/auth/forgot-password` | No | Request a password-reset email |
| POST | `/api/v1/auth/reset-password` | No (reset token in body) | Set a new password using a reset token |
| GET | `/api/v1/users/me` | **Bearer** | The authenticated user's own profile |
| GET | `/api/v1/users/:id` | **Bearer** — `admin`, `manager` | Read another user's profile |
| PATCH | `/api/v1/users/:id/role` | **Bearer** — `admin` | Change a user's role |

---

## 2. Standard Response Envelope

### Success

```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": { }
}
```

`data` is `null` for endpoints that don't return a payload (logout, forgot-password, reset-password).

### Validation error (Zod) — HTTP 400

Thrown whenever the request body/query fails schema validation (`backend/src/app.js` global error handler special-cases `ZodError`):

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

`field` is the dotted path of the offending field (e.g. `"email"`, `"password"`); `errors` can contain more than one entry if multiple fields fail at once.

### All other errors

```json
{
  "success": false,
  "message": "<error message>"
}
```

Status code is whatever the throwing code set as `error.statusCode`, defaulting to `500` if unset. There is no `error.code` / `details` field in the current implementation (unlike the aspirational format shown in `docs/api.md`).

---

## 3. POST /api/v1/auth/register

### Purpose

Creates a new user account **and immediately issues a session for it**. Returns the same `{ user, accessToken, refreshToken }` payload as `/login`, so the client can move straight into onboarding without a second round trip. No email is sent.

### Authentication

Required: No

### Request

#### Headers

```http
Content-Type: application/json
```

`User-Agent` and the caller's IP are captured automatically by the server (`req.get("user-agent")`, `req.ip`) and stored with the session — the client does not send these explicitly.

#### Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "strong-password"
}
```

#### Validation rules (`registerSchema`)

| Field | Rules |
|---|---|
| `name` | string, trimmed, 2–100 chars |
| `email` | string, trimmed, must be a valid email, lowercased before storage |
| `username` | string, trimmed, 3–30 chars, only letters/numbers/underscore (`^[a-zA-Z0-9_]+$`), lowercased before storage |
| `password` | string, 8–128 chars (no complexity/character-class requirement beyond length) |

There is no `companyName` field — company/tenant concepts from the architecture drafts are not implemented.

### Successful Response — `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "66f...",
      "name": "John Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "role": "sales_rep",
      "twoFactorEnabled": false,
      "lastLoginAt": "2026-08-17T06:05:00.000Z",
      "createdAt": "2026-08-17T06:05:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

`role` defaults to `"sales_rep"` for every new account (enum: `admin`, `manager`, `sales_rep`). There is no signup flow that produces an `admin` account.

The `data` object is structurally identical to the one `/login` returns, so a single client-side `handleAuthSuccess(data)` can serve both entry points.

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | Body fails schema validation | `"Validation failed"` (+ `errors` array) |
| 409 | Email already registered | `"Email is already registered"` |
| 409 | Username already taken | `"Username is already taken"` |
| 500 | Unexpected server error | `"Internal server error"` (or the raw error message) |

### Session side effect

Registration goes through the same `issueSession` helper as login: it creates a `Session` document (storing only the SHA-256 hash of the refresh token, plus `userAgent`, `ipAddress`, `expiresAt`) and sets `lastLoginAt`. The refresh token returned here is a first-class refresh token — it works with `/refresh` and `/logout` exactly like one obtained from `/login`.

---

## 4. POST /api/v1/auth/login

### Purpose

Authenticates an existing user with email + password and issues an access/refresh token pair. Also creates a server-side session record tied to the refresh token. This is the second of the two ways into the app — `/register` is the first, and both return the identical payload.

### Authentication

Required: No

### Request

#### Headers

```http
Content-Type: application/json
```

`User-Agent` and the caller's IP are captured automatically by the server (`req.get("user-agent")`, `req.ip`) and stored with the session — the client does not send these explicitly.

#### Body

```json
{
  "email": "john@example.com",
  "password": "strong-password"
}
```

#### Validation rules (`loginSchema`)

| Field | Rules |
|---|---|
| `email` | string, trimmed, must be a valid email, lowercased |
| `password` | string, required (min 1 char), max 128 chars — no minimum-length check here (unlike registration) |

### Successful Response — `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "66f...",
      "name": "John Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "role": "sales_rep",
      "twoFactorEnabled": false,
      "lastLoginAt": "2026-08-17T06:05:00.000Z",
      "createdAt": "2026-08-17T06:05:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

`passwordHash` and `twoFactorSecret` are never included in any response. `twoFactorEnabled` is always `false` today — the model has the field, but no 2FA flow (setup/verify/OTP) is implemented anywhere in this codebase.

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | Body fails schema validation | `"Validation failed"` (+ `errors` array) |
| 401 | Email not found, or password incorrect | `"Invalid email or password"` (identical message for both cases — no account-enumeration leak) |
| 403 | `user.isActive === false` | `"Account is inactive"` |
| 500 | Unexpected server error | — |

---

## 5. POST /api/v1/auth/refresh

### Purpose

Exchanges a valid, unrevoked, unexpired refresh token for a brand-new access/refresh token pair. This is a **rotation**: the old refresh token's session is revoked as part of a successful call, and a new session is created for the new refresh token.

### Authentication

Required: No (Bearer access token is not used here — the refresh token itself, in the body, is the credential)

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

#### Validation rules (`refreshSchema`)

| Field | Rules |
|---|---|
| `refreshToken` | string, required (min 1 char) |

### Successful Response — `200 OK`

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

Note: unlike `/login`, this response does **not** include a `user` object — only the new token pair.

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | Body fails schema validation | `"Validation failed"` (+ `errors` array) |
| 401 | No session matches the hash of the provided refresh token | `"Invalid refresh token"` |
| 401 | Session was already revoked (already used once, or logged out) | `"Refresh token has been revoked"` |
| 401 | Session's `expiresAt` is in the past | `"Refresh token has expired"` |
| 401 | JWT signature invalid or token itself expired | `"Invalid refresh token"` |
| 401 | Token's `type` claim isn't `"refresh"` | `"Invalid refresh token"` |
| 401 | Token's `sub` doesn't match the session's user | `"Invalid refresh token"` |
| 401 | User no longer exists or `isActive === false` | `"Invalid refresh token"` |
| 500 | Unexpected server error | — |

The frontend should treat **any** 401 from this endpoint the same way: clear stored tokens and force the user back to login. Do not try to distinguish the specific messages for UX purposes — they exist for debugging/logging, not for conditional client logic.

---

## 6. POST /api/v1/auth/logout

### Purpose

Revokes the single session associated with the given refresh token. This does not affect other sessions/devices for the same user, and it does not require (or check) an access token.

### Authentication

Required: No (refresh token in body acts as the credential)

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

Same shape/validation as `/refresh` (`refreshSchema` — `refreshToken` required, min 1 char).

### Successful Response — `200 OK`

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | Body fails schema validation | `"Validation failed"` (+ `errors` array) |
| 401 | No session matches the hash of the provided refresh token | `"Invalid refresh token"` |
| 401 | Session already revoked | `"Refresh token has been revoked"` |
| 500 | Unexpected server error | — |

After a successful logout, the access token issued alongside that refresh token is **not** revoked — it remains cryptographically valid until it naturally expires (there is no access-token blacklist). Since no route currently checks access tokens at all, this has no practical effect today, but it matters once protected routes are added: the frontend should discard the access token client-side on logout and not rely on server-side invalidation of it.

---

## 7. POST /api/v1/auth/forgot-password

### Purpose

Starts the password-reset flow: if the email belongs to an account, generates a one-hour reset token and emails a reset link. Always responds identically whether or not the account exists, to prevent email enumeration.

### Authentication

Required: No

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body

```json
{
  "email": "john@example.com"
}
```

#### Validation rules (`forgotPasswordSchema`)

| Field | Rules |
|---|---|
| `email` | string, trimmed, must be a valid email, lowercased |

### Successful Response — `200 OK`

Always this response, regardless of whether the account exists:

```json
{
  "success": true,
  "message": "If the account exists, a password reset link has been sent.",
  "data": null
}
```

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | Body fails schema validation | `"Validation failed"` (+ `errors` array) |
| 500 | Unexpected server error | — |

There is intentionally no 404/"email not found" response — do not build UI that reacts differently based on whether the email "exists."

### Behavior detail

- Reset token: `crypto.randomBytes(32).toString("hex")`, only its SHA-256 hash is stored (`PasswordResetToken.tokenHash`).
- Expiry: fixed **1 hour** from issuance (`RESET_TOKEN_TTL_MS`, hardcoded — not environment-configurable).
- Reset link sent to the user: `${FRONTEND_URL}/reset-password?token=<rawToken>` — the frontend route at that path is expected to read `token` from the query string and submit it to `/reset-password`.
- If the SMTP send fails, the failure is logged server-side and swallowed; the response is unaffected.

---

## 8. POST /api/v1/auth/reset-password

### Purpose

Consumes a password-reset token to set a new password, then revokes **every** active session for that user (forces re-login on all devices).

### Authentication

Required: No (reset token in body acts as the credential)

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body

```json
{
  "token": "raw-reset-token-from-email-link",
  "password": "new-strong-password"
}
```

#### Validation rules (`resetPasswordSchema`)

| Field | Rules |
|---|---|
| `token` | string, required (min 1 char) |
| `password` | string, 8–128 chars (same rule object as registration's password) |

### Successful Response — `200 OK`

```json
{
  "success": true,
  "message": "Password has been reset successfully",
  "data": null
}
```

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | Body fails schema validation | `"Validation failed"` (+ `errors` array) |
| 400 | Token not found, already used, expired, or its owning user no longer exists | `"Invalid or expired reset token."` (same message for all four cases — no distinction) |
| 500 | Unexpected server error | — |

### Behavior detail

- The token is single-use: `PasswordResetToken.usedAt` is set on successful consumption; reusing it returns the same 400 above.
- On success, `revokeAllUserSessions(userId)` is called — every refresh token/session for that user (all devices) is invalidated. Any access tokens already issued remain valid until their own expiry (no access-token blacklist exists), but since no route currently checks access tokens this has no practical effect yet.

---

## 9. Token Behavior Reference

| | Access Token | Refresh Token |
|---|---|---|
| Format | JWT, `HS256`, signed with `JWT_ACCESS_SECRET` | JWT, `HS256`, signed with `JWT_REFRESH_SECRET` |
| Payload claims | `sub` (user id), `role`, `type: "access"`, `iat`, `exp` | `sub` (user id), `type: "refresh"`, `jti` (random UUID, guarantees uniqueness), `iat`, `exp` |
| Lifetime | `JWT_ACCESS_EXPIRES_IN` env var (e.g. `15m`) | `JWT_REFRESH_EXPIRES_IN` env var (e.g. `7d`) |
| Server-side record | None — stateless, cannot be revoked before expiry | Yes — a `Session` document storing only the SHA-256 hash of the token (`refreshTokenHash`), plus `userAgent`, `ipAddress`, `expiresAt`, `revokedAt` |
| Where returned | `/register` and `/login` (initial pair), `/refresh` (rotated pair) | Same as access token |
| Where consumed | Nowhere yet — no route validates it (see [§0](#0-read-this-before-integrating)) | `/refresh` and `/logout`, in the JSON body as `refreshToken` |
| Revocation | Not possible before natural expiry | Revoked (session `revokedAt` set) on: use via `/refresh` (rotation), `/logout`, and — for *all* of a user's sessions at once — a successful `/reset-password` |

**Frontend integration guidance:**
- Send `Authorization: Bearer <accessToken>` on requests once protected endpoints exist; there's nothing to attach it to today.
- Persist the `refreshToken` (e.g. secure storage) and always overwrite it with the latest value returned by `/refresh` — the previous one becomes invalid the instant a new one is issued.
- Any `401` from `/refresh` should be treated as "session is over" — clear local tokens and redirect to login.

---

## 10. HTTP Status Code Summary

| Status | Meaning in this API |
|---|---|
| 200 | Successful request |
| 201 | User created and signed in (`/register` only) |
| 400 | Request failed Zod validation, **or** an invalid/expired/used/not-found token was supplied to `/reset-password` |
| 401 | Login credentials invalid, account inactive path aside (see 403), or any refresh-token problem in `/refresh` / `/logout` |
| 403 | `POST /login` against a user whose `isActive` is `false` |
| 409 | `POST /register` with an email or username already in use |
| 500 | Unexpected server-side failure |

Status codes not used anywhere in the current auth implementation despite appearing in the architecture drafts: `404`, `422`, `429`. There is no rate limiting implemented on any auth endpoint today.

---

## 11. Things intentionally not implemented (do not build UI for these yet)

- `GET /api/v1/auth/me` — does not exist under `/auth`. Use **`GET /api/v1/users/me`** instead ([§12](#12-roles-and-authorization)), which returns the current user from the access token alone.
- Two-factor authentication (OTP setup/verify/disable) — model fields exist (`twoFactorEnabled`, `twoFactorSecret`) but no endpoint or login-time branch uses them.
- Company/tenant registration (`companyName`, company creation, `companyId`) — not part of the `User` model or `/register` request.
- Per-company / tenant isolation of role checks — `requireRole` gates on the global role only; there is no notion of "admin *of company X*" yet.
- "Log out of all devices" endpoint — only single-session logout and the side-effect-of-password-reset case exist.
- Email verification — removed deliberately. There is no `isEmailVerified` field, no verification token model, and no endpoint; do not build a "check your inbox" screen or a verification-pending state.
- Account statuses beyond `isActive` (e.g. `SUSPENDED`, `PENDING_VERIFICATION`) — the model only has a boolean `isActive`.

---

## 12. Roles and Authorization

### Roles

Defined once in `backend/src/constants/roles.js`; the user-model enum, the role validator and every guard read from there.

| Role | Meaning |
|---|---|
| `sales_rep` | Default for every new account |
| `manager` | Can read other users' profiles |
| `admin` | Can read profiles and grant roles |

### How a role is granted

`role` is **never** accepted from `POST /register`. Every account starts as `sales_rep`. To change one:

```
PATCH /api/v1/users/:id/role
Authorization: Bearer <admin accessToken>
Content-Type: application/json

{ "role": "manager" }
```

Rules enforced by this endpoint:

- Caller must be authenticated (`401` otherwise) and must be an `admin` (`403` otherwise).
- **An admin cannot change their own role** (`403`). This prevents the last admin from demoting themselves and locking role management out of the system.
- `role` must be one of the three values above (`400` otherwise).
- On a successful change, **all of the target's sessions are revoked** — their refresh tokens return `401 "Refresh token has been revoked"` and they must log in again.

### Bootstrapping the first admin

There is no admin to call the endpoint with until one exists. Create it out-of-band:

```bash
cd backend
node scripts/promote-user.js user@example.com admin
```

The change is live immediately — because `requireAuth` reads the role from the database, an access token issued *before* the promotion already authenticates as `admin`. No re-login needed.

### Authorization failure responses

| Situation | Status | `message` |
|---|---|---|
| No `Authorization` header, or not `Bearer <token>` | 401 | `Authentication required` |
| Malformed, expired, or wrong-type token | 401 | `Invalid or expired access token` |
| Token valid but the user no longer exists | 401 | `Invalid access token` |
| User exists but `isActive: false` | 403 | `Account is inactive` |
| Authenticated, but role not permitted | 403 | `You do not have permission to perform this action` |

The 403 deliberately does not name the required role — that would leak the permission model.
