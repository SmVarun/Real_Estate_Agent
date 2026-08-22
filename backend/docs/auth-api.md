# Authentication API — Frontend Integration Guide

This document describes the authentication API **exactly as currently implemented** in the backend (`backend/src/`). It is generated from the real routes, controllers, services, validators, and models in this repository — not from the earlier architecture drafts in `docs/authentication.md` / `docs/api.md`, which describe a larger *planned* system (2FA, `GET /auth/me`, per-tenant isolation, etc.) that has **not** been built yet. Where the real implementation diverges from those drafts, this document calls it out explicitly.

Base URL for every endpoint below:

```
/api/v1/auth
```

(Mounted in `backend/src/app.js` via `app.use("/api/v1/auth", authRouter)`.)

---

## 0. Read this before integrating

> **Breaking change — authentication moved from bearer tokens to httpOnly cookies.**
> Tokens are no longer returned in the JSON body of `/register`, `/login`, or `/refresh`, and the `Authorization` header is no longer read by anything. The server sets `accessToken` and `refreshToken` as httpOnly cookies, and the browser sends them back automatically. Server-side session records are gone entirely. See [§13](#13-migrating-from-the-bearer-token-flow) for the full delta.

- **Every request must be made with credentials.** Cookies are only attached cross-origin when the client opts in — `fetch(url, { credentials: "include" })`, or `axios.defaults.withCredentials = true`. Omit it and the browser silently sends no cookie, and every protected call fails with `401 Authentication required`.
- **The frontend never sees a token.** Both cookies are `httpOnly`, so `document.cookie` cannot read them and there is nothing to persist in `localStorage`. Do not build token storage, token parsing, or an `Authorization` header interceptor — there is no token to put in one.
- **`FRONTEND_URL` must be exact.** CORS runs as `cors({ origin: credential.frontendUrl, credentials: true })`. With `credentials: true` a wildcard origin is invalid, so the env var must name the frontend's exact scheme+host+port (e.g. `http://localhost:5173`). A mismatch shows up as a CORS error, not a 401.
- **Authentication is fully stateless.** There is no `Session` collection any more. A refresh token is valid because its signature verifies and its user is still active — nothing is looked up or stored. The practical consequence is in [§10](#10-token-behavior-reference): **tokens cannot be revoked before they expire.**
- **Refresh tokens are NOT rotated.** `POST /refresh` mints a new access token only. The refresh cookie is left exactly as it was and stays valid for its full `JWT_REFRESH_EXPIRES_IN` lifetime. (This is the reverse of the old behaviour, which rotated on every call.)
- **Roles cannot be self-assigned.** `POST /register` ignores a `role` field in the body — Zod strips it and the account is created as `sales_rep`. This is deliberate: honouring a client-supplied role would let anyone hitting public signup mint an admin. Roles change only through `PATCH /api/v1/users/:id/role`, which is admin-only. See [§12](#12-roles-and-authorization).
- **Authorization reads the database, not the token.** The access token carries a `role` claim, but `requireAuth` ignores it and loads the current user instead. A promotion, demotion, or deactivation therefore takes effect on the *next request* rather than after the ~15-minute token lifetime.
- **Registration logs the user in.** `POST /register` returns the same `{ user }` payload as `POST /login` and sets the same two cookies. The frontend must **not** call `/login` after a successful `/register` — go straight to onboarding.
- **There is no email verification.** No verification email is sent, there are no `/verify-email` or `/resend-verification` endpoints, and the `User` model has no `isEmailVerified` field. Register and login are the only two ways into the app.
- All JSON responses share one envelope shape (see [§2](#2-standard-response-envelope)).

---

## 1. Endpoint Index

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create a new user account **and sign them in** |
| POST | `/api/v1/auth/login` | No | Authenticate and receive auth cookies |
| POST | `/api/v1/auth/refresh` | Refresh **cookie** | Mint a new access token |
| POST | `/api/v1/auth/logout` | No | Clear both auth cookies |
| POST | `/api/v1/auth/forgot-password` | No | Request a password-reset email |
| POST | `/api/v1/auth/reset-password` | No (reset token in body) | Set a new password using a reset token |
| GET | `/api/v1/users/me` | **Cookie** | The authenticated user's own profile |
| GET | `/api/v1/users/:id` | **Cookie** — `admin`, `manager` | Read another user's profile |
| PATCH | `/api/v1/users/:id/role` | **Cookie** — `admin` | Change a user's role |
| — | `/api/v1/company/*` | **Cookie** — `admin` | See `company-api.md` |
| — | `/api/v1/documents/*` | **Cookie** — `admin` | See `document-api.md` |

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

`data` is `null` for endpoints that don't return a payload (refresh, logout, forgot-password, reset-password).

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

## 3. The auth cookies

Both cookies are set by `backend/src/utils/cookie.js` and share one options object:

| Option | Value | Why |
|---|---|---|
| `httpOnly` | `true` | Keeps tokens out of `document.cookie`, so XSS cannot read them |
| `secure` | `true` in production, `false` otherwise | Driven by `NODE_ENV`, so cookies still work over plain `http` in local dev |
| `sameSite` | `"lax"` | Top-level navigations from the frontend carry the cookie; cross-site POSTs do not |
| `path` | `"/"` | Sent to every route under the API |

| Cookie | Contents | `maxAge` |
|---|---|---|
| `accessToken` | Access JWT | `JWT_ACCESS_EXPIRES_IN` (e.g. `15m`) |
| `refreshToken` | Refresh JWT | `JWT_REFRESH_EXPIRES_IN` (e.g. `7d`) |

`maxAge` is derived from the same duration string that sets the JWT's own `exp`, parsed by `getDurationMs` in `backend/src/utils/date.js` — so the cookie and the token inside it can never expire at different times.

A response that issues cookies looks like this on the wire:

```http
HTTP/1.1 200 OK
Set-Cookie: accessToken=eyJhbGciOi...; Max-Age=900; Path=/; HttpOnly; SameSite=Lax
Set-Cookie: refreshToken=eyJhbGciOi...; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
Content-Type: application/json
```

### `sameSite: "lax"` and cross-site frontends

`lax` means the cookie rides along on same-site requests and top-level navigations, but **not** on cross-site XHR/`fetch`. During local development the frontend (`localhost:5173`) and API (`localhost:3000`) differ only by port, which is still same-site, so this works. If the frontend is ever deployed on a genuinely different site than the API, these cookies will need `sameSite: "none"` plus `secure: true` — change it in `cookie.js`, not per-route.

---

## 4. POST /api/v1/auth/register

### Purpose

Creates a new user account **and immediately signs it in** by setting both auth cookies. Returns the same `{ user }` payload as `/login`, so the client can move straight into onboarding without a second round trip. No email is sent.

### Authentication

Required: No

### Request

```http
POST /api/v1/auth/register
Content-Type: application/json
```

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

There is no `companyName` field — the company profile is created separately through `POST /api/v1/company/onboarding` (see `company-api.md`).

### Successful Response — `201 Created`

Sets `accessToken` and `refreshToken` cookies, plus:

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
      "isActive": true,
      "lastLoginAt": "2026-08-20T03:15:54.393Z",
      "createdAt": "2026-08-20T03:15:54.362Z"
    }
  }
}
```

`role` defaults to `"sales_rep"` for every new account (enum: `admin`, `manager`, `sales_rep`). There is no signup flow that produces an `admin` account.

`data` is structurally identical to what `/login` returns, so a single client-side `handleAuthSuccess(data.user)` can serve both entry points.

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 400 | Body fails schema validation | `"Validation failed"` (+ `errors` array) |
| 409 | Email already registered | `"Email is already registered"` |
| 409 | Username already taken | `"Username is already taken"` |
| 500 | Unexpected server error | `"Internal server error"` (or the raw error message) |

### Side effect

Registration goes through the same `issueTokens` helper as login: it signs both JWTs and sets `lastLoginAt`. Nothing is persisted beyond the user document itself — there is no session record.

---

## 5. POST /api/v1/auth/login

### Purpose

Authenticates an existing user with email + password and sets both auth cookies. This is the second of the two ways into the app — `/register` is the first, and both return the identical payload.

### Authentication

Required: No

### Request

```http
POST /api/v1/auth/login
Content-Type: application/json
```

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

Sets `accessToken` and `refreshToken` cookies, plus:

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
      "isActive": true,
      "lastLoginAt": "2026-08-20T03:15:54.393Z",
      "createdAt": "2026-08-20T03:15:54.362Z"
    }
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

## 6. POST /api/v1/auth/refresh

### Purpose

Mints a **new access token** from a still-valid refresh token and overwrites the `accessToken` cookie. The refresh token itself is untouched — not rotated, not revoked, not re-issued.

### Authentication

The `refreshToken` cookie is the credential. No body, no header.

### Request

```http
POST /api/v1/auth/refresh
```

The request body is ignored entirely — `refreshSchema` was deleted along with the bearer flow. Send nothing.

### Successful Response — `200 OK`

Sets a fresh `accessToken` cookie (the `refreshToken` cookie is left alone), plus:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": null
}
```

Note that `data` is `null` — no tokens and no `user` object come back. If the frontend needs the current user after refreshing, call `GET /api/v1/users/me`.

### Error Responses

| Status | Condition | `message` |
|---|---|---|
| 401 | No `refreshToken` cookie was sent | `"Refresh token is required"` |
| 401 | JWT signature invalid, or the token has expired | `"Invalid or expired refresh token"` |
| 401 | Token's `type` claim isn't `"refresh"`, or `sub` is missing | `"Invalid refresh token"` |
| 401 | User no longer exists or `isActive === false` | `"Invalid refresh token"` |
| 500 | Unexpected server error | — |

The frontend should treat **any** 401 from this endpoint the same way: send the user back to login. Do not try to distinguish the specific messages for UX purposes — they exist for debugging/logging, not for conditional client logic.

### Recommended client pattern

Because the access cookie expires silently, the natural pattern is a response interceptor: on a `401` from any protected endpoint, call `/refresh` once, then replay the original request. If `/refresh` also 401s, redirect to login.

```js
// axios example — withCredentials is what makes the cookies flow
api.interceptors.response.use(null, async (error) => {
  const original = error.config;

  if (error.response?.status !== 401 || original._retried) {
    return Promise.reject(error);
  }

  original._retried = true;   // refresh once per request, never loop

  try {
    await api.post("/auth/refresh");
    return api(original);
  } catch {
    redirectToLogin();
    return Promise.reject(error);
  }
});
```

Guard the retry with a flag as above. Without it, a `/refresh` that returns 401 re-enters the interceptor and loops.

---

## 7. POST /api/v1/auth/logout

### Purpose

Clears both auth cookies. That is the entire operation — with no server-side session there is nothing else to tear down.

### Authentication

Required: No. Logout deliberately does not check anything, so a client holding stale or missing cookies can still clear itself.

### Request

```http
POST /api/v1/auth/logout
```

No body.

### Successful Response — `200 OK`

```http
Set-Cookie: accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax
Set-Cookie: refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax
```

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

This endpoint has no failure mode short of a 500 — it always succeeds.

> **Logout is browser-local.** Clearing the cookie removes the credential from *this* browser, but the JWT it contained stays cryptographically valid until its own `exp`. Anyone who captured that token beforehand can keep using it. There is no token blacklist and no "log out of all devices" — see [§10](#10-token-behavior-reference).

---

## 8. POST /api/v1/auth/forgot-password

### Purpose

Starts the password-reset flow: if the email belongs to an account, generates a one-hour reset token and emails a reset link. Always responds identically whether or not the account exists, to prevent email enumeration.

### Authentication

Required: No

### Request

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json
```

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

## 9. POST /api/v1/auth/reset-password

### Purpose

Consumes a password-reset token to set a new password, then clears the auth cookies **on the browser making the call**.

### Authentication

Required: No (reset token in body acts as the credential)

### Request

```http
POST /api/v1/auth/reset-password
Content-Type: application/json
```

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

Clears both auth cookies, plus:

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
- **A password reset no longer signs the user out everywhere.** Under the old session model, `revokeAllUserSessions(userId)` killed every device. That function no longer exists. Tokens already issued to other browsers stay valid until they expire — up to `JWT_REFRESH_EXPIRES_IN`. This is the standard cost of stateless auth, and it means a password reset is **not** an effective response to a stolen token.

---

## 10. Token Behavior Reference

| | Access Token | Refresh Token |
|---|---|---|
| Format | JWT, `HS256`, signed with `JWT_ACCESS_SECRET` | JWT, `HS256`, signed with `JWT_REFRESH_SECRET` |
| Payload claims | `sub` (user id), `role`, `type: "access"`, `iat`, `exp` | `sub` (user id), `type: "refresh"`, `iat`, `exp` |
| Lifetime | `JWT_ACCESS_EXPIRES_IN` env var (e.g. `15m`) | `JWT_REFRESH_EXPIRES_IN` env var (e.g. `7d`) |
| Transport | `accessToken` httpOnly cookie | `refreshToken` httpOnly cookie |
| Server-side record | None | None |
| Where issued | `/register`, `/login`, `/refresh` | `/register`, `/login` only |
| Where consumed | `requireAuth`, on every protected route | `/refresh` |
| Rotation | Replaced on every `/refresh` | Never rotated |
| Revocation | Not possible before natural expiry | Not possible before natural expiry |

The two secrets must be **different values**. Distinct secrets plus the `type` claim are what stop a refresh token from being accepted as an access token: `requireAuth` verifies against `JWT_ACCESS_SECRET`, so a refresh token fails at the signature check before its `type` is even read.

### Consequences of statelessness — read before shipping

Deleting the session store removed the only revocation mechanism in the system. Concretely, today:

- Logging out does **not** invalidate the token — it only removes the browser's copy.
- Resetting a password does **not** sign other devices out.
- Deactivating a user (`isActive: false`) or changing their role **does** take effect on the next request, because `requireAuth` and `refreshAccessToken` both re-read the user from MongoDB. This is the one live check that survives.
- A leaked refresh token is usable until it expires, and the only remedy is rotating `JWT_REFRESH_SECRET`, which signs every user out at once.

If real revocation is needed later, the usual minimal fix is a `tokenVersion` integer on the user document, embedded as a claim and compared on every verify — a single indexed read, without restoring a whole session collection.

---

## 11. HTTP Status Code Summary

| Status | Meaning in this API |
|---|---|
| 200 | Successful request |
| 201 | User created and signed in (`/register` only) |
| 400 | Request failed Zod validation, **or** an invalid/expired/used/not-found token was supplied to `/reset-password` |
| 401 | Login credentials invalid, missing/invalid auth cookie, or any refresh-token problem in `/refresh` |
| 403 | Account inactive, or authenticated but lacking the required role |
| 409 | `POST /register` with an email or username already in use |
| 500 | Unexpected server-side failure |

Status codes not used anywhere in the current auth implementation despite appearing in the architecture drafts: `404`, `422`, `429`. There is no rate limiting implemented on any auth endpoint today.

---

## 12. Roles and Authorization

### Roles

Defined once in `backend/src/constants/roles.js`; the user-model enum, the role validator and every guard read from there.

| Role | Meaning |
|---|---|
| `sales_rep` | Default for every new account |
| `manager` | Can read other users' profiles |
| `admin` | Can read profiles, grant roles, and manage the company profile and documents |

### How a role is granted

`role` is **never** accepted from `POST /register`. Every account starts as `sales_rep`. To change one:

```http
PATCH /api/v1/users/:id/role
Content-Type: application/json
Cookie: accessToken=<admin's access token>
```

```json
{ "role": "manager" }
```

Rules enforced by this endpoint:

- Caller must be authenticated (`401` otherwise) and must be an `admin` (`403` otherwise).
- **An admin cannot change their own role** (`403`). This prevents the last admin from demoting themselves and locking role management out of the system.
- `role` must be one of the three values above (`400` otherwise).
- The new role is in force on the target's **very next request** — `requireAuth` reads the role from the database, so the stale `role` claim in their existing access token is never used for authorization. (Under the old session model this endpoint also revoked their sessions and forced a re-login; it no longer does, and no longer needs to.)

### Bootstrapping the first admin

There is no admin to call the endpoint with until one exists. Create it out-of-band:

```bash
cd backend
node scripts/promote-user.js user@example.com admin
```

The change is live immediately — no re-login needed, for the same reason as above.

### Authorization failure responses

| Situation | Status | `message` |
|---|---|---|
| No `accessToken` cookie sent | 401 | `Authentication required` |
| Malformed, expired, or wrong-type token | 401 | `Invalid or expired access token` |
| Token valid but the user no longer exists | 401 | `Invalid access token` |
| User exists but `isActive: false` | 403 | `Account is inactive` |
| Authenticated, but role not permitted | 403 | `You do not have permission to perform this action` |

The 403 deliberately does not name the required role — that would leak the permission model.

---

## 13. Migrating from the bearer-token flow

If you are updating a client written against the previous version of this document:

| Then | Now |
|---|---|
| `data.accessToken` / `data.refreshToken` in the `/register` and `/login` response | Gone. `data` is `{ user }` only; tokens arrive as `Set-Cookie` |
| Store tokens in `localStorage` | Store nothing. Delete the token storage layer |
| `Authorization: Bearer <token>` request interceptor | Delete it. Set `withCredentials` / `credentials: "include"` instead |
| `POST /refresh` with `{ refreshToken }` in the body | `POST /refresh` with no body |
| `/refresh` returns a new token pair; overwrite the stored refresh token | `/refresh` returns `data: null`; nothing to store, and the refresh token does not change |
| `POST /logout` with `{ refreshToken }` in the body | `POST /logout` with no body |
| Password reset signs out all devices | Only clears the calling browser's cookies |
| Role change forces the target to re-login | Takes effect on their next request; no re-login |

Deleted from the backend, in case anything still imports them: `models/session.model.js`, `services/session.service.js`, `utils/token.js`, `refreshSchema` from `validator/auth.validator.js`, and `extractBearerToken` from `middleware/auth.middleware.js`.

### Local development checklist

1. `npm install` — `cookie-parser` and `cors` are new dependencies.
2. Set `FRONTEND_URL` to the frontend's exact origin (e.g. `http://localhost:5173`).
3. Set `NODE_ENV` — leave it unset or `development` locally so `secure` cookies don't break plain `http`.
4. Turn on `withCredentials` in the frontend HTTP client.
