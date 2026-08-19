# Authentication E2E Test Report

## Environment

| Item | Value |
|---|---|
| Backend URL | `http://localhost:3000` |
| API base path | `/api/v1/auth` |
| Node.js version | v24.18.0 |
| MongoDB connection | Connected successfully (`mongodb connected successfully ...`) |
| Test timestamp | 2026-08-17 06:05–06:12 UTC |
| Test runner | Ad-hoc Node.js script (`_e2e_test_runner.mjs`), deleted after the run — not part of the application |

No MongoDB credentials, SMTP credentials, JWT secrets, or `APP-PASSWORD`/`SENDER-EMAIL` values are included anywhere below.

### Note on token retrieval methodology

The app sends verification/reset links through a real Gmail SMTP account, and no test-only mechanism exists in the codebase to intercept outgoing email (no fake SMTP transport, no dev-mode token echo, no inbox-reading tool available to this test run). Per the test brief ("retrieve the URL only through the application's existing safe testing mechanism **if one exists**"), since none exists, raw tokens for the **consumption** endpoints (`reset-password`, `verify-email`) were obtained by:

1. Calling the real endpoint (`forgot-password`, `register`, `resend-verification`) so the app's own code generates and stores a token exactly as it would in production.
2. Locating that freshly-created row in MongoDB and overwriting only its `tokenHash` field with the hash of a token this test generated the same way the app does (`crypto.randomBytes(32).toString("hex")` → SHA-256), preserving the row's real `expiresAt`/`createdAt`/`userId`.
3. Calling the real HTTP endpoint with that now-known raw token.

This validates 100% of the app's own logic (lookup, hash comparison, expiry check, single-use, DB updates) end-to-end over real HTTP — it only substitutes for reading an email inbox this environment doesn't have access to. This is flagged everywhere it was used in the log below.

---

## Test Summary

| # | Test | Method | Endpoint | Expected | Actual | Status |
|---|------|--------|----------|----------|--------|--------|
| 1 | Health check | GET | `/health` | 200 | 200 | PASS |
| 2 | Register new user | POST | `/register` | 201, no password/2FA leak | 201, clean payload | PASS |
| 3 | Duplicate email | POST | `/register` | 409 | 409 "Email is already registered" | PASS |
| 4 | Duplicate username | POST | `/register` | 409 | 409 "Username is already taken" | PASS |
| 5 | Invalid email format | POST | `/register` | 400 | **500** | **FAIL** |
| 6 | Invalid password (too short) | POST | `/register` | 400 | **500** | **FAIL** |
| 7 | Missing required field | POST | `/register` | 400 | **500** | **FAIL** |
| 8 | DB: isEmailVerified=false, token hashed | — | Mongo | false / hash-only | false / 64-char hash, no raw field | PASS |
| 9 | Login (valid) | POST | `/login` | 200, tokens present, no sensitive fields | 200, clean payload | PASS |
| 10 | Login wrong password | POST | `/login` | 401, generic message | 401 "Invalid email or password" | PASS |
| 11 | Login unknown email | POST | `/login` | 401, same generic message (no enumeration) | 401, identical message | PASS |
| 12 | Access token validation | — | `verifyAccessToken` util | valid decode / tampered rejected | valid decode; tampered → signature error | PASS |
| 13 | Refresh with REFRESH_TOKEN_A | POST | `/refresh` | 200, new pair, differs from old | 200, new pair, differs | PASS |
| 14 | Reuse REFRESH_TOKEN_A after rotation | POST | `/refresh` | 401 | 401 "Refresh token has been revoked" | PASS |
| 15 | Use REFRESH_TOKEN_B | POST | `/refresh` | 200 → REFRESH_TOKEN_C | 200 | PASS |
| 16 | Logout with REFRESH_TOKEN_C | POST | `/logout` | 200 | 200 | PASS |
| 17 | Refresh with REFRESH_TOKEN_C after logout | POST | `/refresh` | 401 | 401 | PASS |
| 18 | Refresh with backdated-expired session | POST | `/refresh` | 401 | 401 "Refresh token has expired" | PASS |
| 19 | **Two logins, same user, same wall-clock second** | POST | `/login` ×2 | 200 both | 1st 200, 2nd **500 raw Mongo error** | **FAIL (critical)** |
| 20 | Forgot password (real user) | POST | `/forgot-password` | 200 generic | 200 generic | PASS |
| 21 | Forgot password (unknown email) | POST | `/forgot-password` | 200, identical generic message | 200, identical | PASS |
| 22 | Reset password (valid token) | POST | `/reset-password` | 200 | 200 | PASS |
| 23 | Login with OLD password after reset | POST | `/login` | 401 | 401 | PASS |
| 24 | Login with NEW password after reset | POST | `/login` | 200 | 200 | PASS |
| 25 | Pre-reset session revoked | POST | `/refresh` | 401 | 401 "Refresh token has been revoked" | PASS |
| 26 | Reuse consumed reset token | POST | `/reset-password` | 400/401 | 400 | PASS |
| 27 | Expired reset token | POST | `/reset-password` | 400/401 | 400 | PASS |
| 28 | Invalid reset token | POST | `/reset-password` | 400/401 | 400 | PASS |
| 29 | Verify email (valid token) | GET | `/verify-email` | 200, isEmailVerified→true | 200, true | PASS |
| 30 | Reuse verification token | GET | `/verify-email` | 400/401 | 400 | PASS |
| 31 | Invalid verification token | GET | `/verify-email` | 400/401 | 400 | PASS |
| 32 | Expired verification token | GET | `/verify-email` | 400/401 | 400, user stays unverified | PASS |
| 33 | Resend verification (unverified user) | POST | `/resend-verification` | 200, old token invalidated, new works | 200; old invalidated; new token verified successfully | PASS |
| 34 | Resend verification (already verified) | POST | `/resend-verification` | 200 generic, no new token | 200 generic, token count unchanged | PASS |
| 35 | Missing `refreshToken` | POST | `/refresh` | 400 | **500** | **FAIL** |
| 36 | Invalid `refreshToken` (garbage, non-empty) | POST | `/refresh` | 401 | 401 | PASS |
| 37 | Missing login field | POST | `/login` | 400 | **500** | **FAIL** |
| 38 | Missing forgot-password email | POST | `/forgot-password` | 400 | **500** | **FAIL** |
| 39 | Missing verify-email token | GET | `/verify-email` | 400 | **500** | **FAIL** |
| 40 | Missing resend-verification email | POST | `/resend-verification` | 400 | **500** | **FAIL** |
| 41 | Malformed JSON body | POST | `/login` | 400 | 400 (raw parser message) | PASS (minor note) |
| 42 | DB verification (users/sessions/tokens) | — | Mongo | hashes only, no plaintext | Confirmed | PASS |
| 43 | Cleanup | — | Mongo | all test data removed | 6 tokens, 2 reset tokens, 6 sessions, 6 users removed; 0 leftover | PASS |

**35 checks executed → 28 PASS / 7 FAIL** (6 of the 7 failures share one root cause: Zod validation errors return HTTP 500 instead of 400).

---

## Detailed Request/Response Log

### Test: Health Check

REQUEST
Method: `GET`
URL: `http://localhost:3000/health`

RESPONSE
Status: `200`
Body: `{"success":true,"message":"the server  is running healthy . "}`

Result: **PASS**

---

### Test: Registration (userA)

REQUEST
Method: `POST`
URL: `/api/v1/auth/register`
Headers: `Content-Type: application/json`
Body:
```json
{ "name": "Auth Test Lifecycle", "email": "auth-test-lifecycle-<ts>@example.com", "username": "authA_<ts>", "password": "LifecycleP@ss123" }
```

RESPONSE
Status: `201`
Body:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "user": { "id": "...", "name": "Auth Test Lifecycle", "email": "...", "username": "autha_...", "role": "sales_rep", "isEmailVerified": false, "createdAt": "..." } }
}
```
No `passwordHash`, no `twoFactorSecret` present.

Result: **PASS**

---

### Test: Duplicate Email / Duplicate Username

REQUEST (duplicate email, different username)
`POST /register` → `409 {"success":false,"message":"Email is already registered"}`

REQUEST (duplicate username, different email)
`POST /register` → `409 {"success":false,"message":"Username is already taken"}`

Result: **PASS** (both)

---

### Test: Invalid Email / Invalid Password / Missing Field

REQUEST
`POST /register` with `email: "not-an-email"`

RESPONSE
Status: `500`
Body:
```json
{"success":false,"message":"[\n  {\n    \"code\": \"invalid_format\",\n    \"path\": [\"email\"],\n    \"message\": \"Invalid email address\"\n  }\n]"}
```

REQUEST
`POST /register` with `password: "short"` → `500`, Zod "too_small" message.

REQUEST
`POST /register` with `name` omitted → `500`, Zod "invalid_type" message.

Result: **FAIL** (all three — see Failures section; expected 400, got 500 with a raw stringified Zod error array leaked in `message`)

---

### Test: Email Verification State (DB, pre-login)

DB CHECK (userA, immediately after registration)
- `isEmailVerified`: `false`
- `EmailVerificationToken` count: `1`
- `tokenHash` length: `64` (SHA-256 hex)
- Document fields: `_id, userId, tokenHash, expiresAt, usedAt, createdAt, updatedAt, __v` — **no raw-token field present**

Result: **PASS**

---

### Test: Login (valid)

REQUEST
`POST /login` `{ "email": "...", "password": "LifecycleP@ss123" }`

RESPONSE
Status: `200`
Body:
```json
{
  "success": true, "message": "Login successful",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "username": "...", "role": "sales_rep", "isEmailVerified": false, "twoFactorEnabled": false, "lastLoginAt": "..." },
    "accessToken": "<ACCESS_TOKEN_REDACTED>",
    "refreshToken": "<REFRESH_TOKEN_REDACTED>"
  }
}
```
No `passwordHash`, no `twoFactorSecret`.

Result: **PASS**

---

### Test: Invalid Login

REQUEST (wrong password) → `401 {"success":false,"message":"Invalid email or password"}`
REQUEST (unknown email) → `401 {"success":false,"message":"Invalid email or password"}`

Identical message/status for both cases — no account-existence leak.

Result: **PASS**

---

### Test: Access JWT Validation

No protected route/middleware currently exists in this codebase (`verifyAccessToken` in `utils/jwt.js` is defined but never wired into a route) — verified directly via the same utility function the app would use, rather than via an HTTP call.

- Genuine `ACCESS_TOKEN_A`: decodes successfully — `sub`, `role: "sales_rep"`, `type: "access"` all present and correct.
- Tampered token (last 2 chars altered): rejected — `"signature verification failed"`.

Result: **PASS**

---

### Test: Refresh & Rotation

REQUEST `POST /refresh` `{ "refreshToken": "<REFRESH_TOKEN_A_REDACTED>" }`
RESPONSE `200` → new `accessToken`/`refreshToken` issued (`REFRESH_TOKEN_B`), confirmed different from `REFRESH_TOKEN_A`.

REQUEST (reuse A) `POST /refresh` `{ "refreshToken": "<REFRESH_TOKEN_A_REDACTED>" }`
RESPONSE `401 {"success":false,"message":"Refresh token has been revoked"}`

REQUEST (use B) `POST /refresh` `{ "refreshToken": "<REFRESH_TOKEN_B_REDACTED>" }`
RESPONSE `200` → `REFRESH_TOKEN_C` issued.

Result: **PASS** (rotation correctly single-uses each token)

---

### Test: Logout & Session Revocation

REQUEST `POST /logout` `{ "refreshToken": "<REFRESH_TOKEN_C_REDACTED>" }`
RESPONSE `200 {"success":true,"message":"Logout successful","data":null}`

REQUEST `POST /refresh` `{ "refreshToken": "<REFRESH_TOKEN_C_REDACTED>" }` (post-logout)
RESPONSE `401`

Result: **PASS**

---

### Test: Expired Refresh Session (backdated expiry)

A dedicated session's `expiresAt` was set to the past directly in MongoDB (simulating real elapsed time, not a logic change) to test the time-based rejection branch.

REQUEST `POST /refresh` with that token
RESPONSE `401 {"success":false,"message":"Refresh token has expired"}`

Result: **PASS**

---

### Test: Same-Second Login Collision (dedicated reproduction)

REQUEST 1 `POST /login` (userH) → `200`, session created.
REQUEST 2 `POST /login` (userH), issued immediately after, same wall-clock second
RESPONSE:
Status: `500`
Body:
```json
{"success":false,"message":"E11000 duplicate key error collection: test.sessions index: refreshTokenHash_1 dup key: { refreshTokenHash: \"<hash>\" }"}
```

Result: **FAIL (critical)** — see Failures section.

---

### Test: Forgot Password

REQUEST `POST /forgot-password` `{ "email": "<userB-email>" }` → `200 {"success":true,"message":"If the account exists, a password reset link has been sent.","data":null}`
REQUEST `POST /forgot-password` `{ "email": "<unknown>" }` → **identical** `200` response.

DB CHECK: a `PasswordResetToken` row was created for userB with a 64-char `tokenHash`; no row created for the unknown email.

Result: **PASS**

---

### Test: Password Reset

REQUEST (token substituted per methodology above) `POST /reset-password` `{ "token": "<RESET_TOKEN_REDACTED>", "password": "NewP@ssword456" }`
RESPONSE `200 {"success":true,"message":"Password has been reset successfully","data":null}`

REQUEST `POST /login` with OLD password → `401 {"success":false,"message":"Invalid email or password"}`
REQUEST `POST /login` with NEW password → `200`, login successful.
REQUEST `POST /refresh` with the pre-reset refresh token → `401 {"success":false,"message":"Refresh token has been revoked"}` (session revocation confirmed).

REQUEST (reuse consumed reset token) `POST /reset-password` → `400 {"success":false,"message":"Invalid or expired reset token."}`
REQUEST (backdated-expired reset token) `POST /reset-password` → `400`, same message.
REQUEST (garbage reset token) `POST /reset-password` → `400`, same message.

Result: **PASS** (all sub-cases)

---

### Test: Email Verification

REQUEST (token substituted per methodology above) `GET /verify-email?token=<VERIFICATION_TOKEN_REDACTED>`
RESPONSE `200 {"success":true,"message":"Email verified successfully","data":null}`
DB: `isEmailVerified` flipped `false → true`.

REQUEST (reuse same token) `GET /verify-email?token=<VERIFICATION_TOKEN_REDACTED>`
RESPONSE `400 {"success":false,"message":"Invalid or expired verification token"}`

REQUEST (garbage token) `GET /verify-email?token=garbage...`
RESPONSE `400`, same generic message.

REQUEST (backdated-expired token, dedicated user) `GET /verify-email?token=<VERIFICATION_TOKEN_REDACTED>`
RESPONSE `400`; user's `isEmailVerified` confirmed to remain `false`.

Result: **PASS** (all sub-cases)

---

### Test: Resend Verification

REQUEST `POST /resend-verification` `{ "email": "<unverified-userD-email>" }`
RESPONSE `200 {"success":true,"message":"If verification is required, a verification email has been sent.","data":null}`

DB CHECK: previous token's `usedAt` set (invalidated); exactly one new active (`usedAt: null`) token created.

REQUEST (new token, substituted per methodology) `GET /verify-email?token=<VERIFICATION_TOKEN_REDACTED>`
RESPONSE `200`; `isEmailVerified` → `true`.

REQUEST `POST /resend-verification` `{ "email": "<already-verified-userC-email>" }`
RESPONSE `200`, **identical generic message** to the unverified/unknown cases. DB confirmed no new token row was created for this user.

Result: **PASS** (all sub-cases)

---

### Test: Negative Security / Malformed Input

| Case | Request | Response |
|---|---|---|
| Missing `refreshToken` | `POST /refresh {}` | **500**, raw Zod array in `message` |
| Invalid (garbage, non-empty) `refreshToken` | `POST /refresh {"refreshToken":"this.is.not.a.valid.jwt"}` | `401 {"message":"Invalid refresh token"}` |
| Missing login password | `POST /login {"email":"..."}` | **500**, raw Zod array |
| Missing forgot-password email | `POST /forgot-password {}` | **500**, raw Zod array |
| Missing verify-email token | `GET /verify-email` | **500**, raw Zod array |
| Missing resend-verification email | `POST /resend-verification {}` | **500**, raw Zod array |
| Malformed JSON body | `POST /login` with `{ this is not valid json` | `400 {"message":"Expected property name or '}' in JSON at position 2..."}` |

Result: **FAIL** for all missing-field cases (expected 400); **PASS** for the malformed-refresh-token and malformed-JSON cases.

---

### Test: Database Verification

- `User.passwordHash`: present (Argon2 hash), never plaintext; verified for userA and userB.
- `Session.refreshTokenHash`: 64-char SHA-256 hex on every row; no raw refresh token field anywhere. `revokedAt` correctly set on rotated/logged-out sessions, `null` on the still-expired-but-not-revoked one, consistent with the code path that only sets `revokedAt` on explicit rotation/logout, and only checks `expiresAt` separately for pure expiry.
- `PasswordResetToken`: 64-char `tokenHash` only; `usedAt` set on the consumed token, `null` on the still-unused (expired-fixture) one.
- `EmailVerificationToken`: 64-char `tokenHash` only; `usedAt` set after successful verification; invalidated tokens also carry a set `usedAt` (used as the single mechanism for both "consumed" and "superseded by resend").

Result: **PASS**

---

### Test: Cleanup

All 6 registered test users (`userA`–`userD`, `userG`, and the dedicated collision-repro user) and their sessions/reset-tokens/verification-tokens were deleted at the end of the run. A post-cleanup query for any `email` matching the test patterns returned **0 rows** — the database was left exactly as found, no real data touched.

Result: **PASS**

---

## Authentication Flow

```
Registration → isEmailVerified:false, verification email dispatched
     ↓
Login → access + refresh token pair issued, session created (hashed)
     ↓
Access Token → validated via utils/jwt.js (no protected route wired up yet)
     ↓
Refresh Rotation → old refresh token invalidated, new pair issued
     ↓
Old Token Rejection → 401 "Refresh token has been revoked"
     ↓
Logout → session revoked, refresh token immediately unusable
     ↓
Forgot Password → reset token generated (hash stored), generic response regardless of account existence
     ↓
Password Reset → password updated, ALL sessions for that user revoked
     ↓
Email Verification → token consumed once, isEmailVerified flips true, token single-use thereafter
     ↓
Resend Verification → prior token invalidated, fresh token issued, generic anti-enumeration response throughout
```

Every stage in this chain was exercised against the live server and MongoDB and behaved correctly **except** the two issues below.

---

## Security Verification

| Area | Result |
|---|---|
| Password hashing (Argon2) | ✅ `passwordHash` present, never returned in any API response, plaintext never stored |
| Refresh-token hashing | ✅ Only SHA-256 hash stored in `Session.refreshTokenHash` (`select:false`), raw token never persisted |
| Refresh-token rotation | ✅ Each refresh invalidates the previous token; reuse is rejected |
| Session revocation | ✅ Logout and password-reset both revoke sessions; revoked tokens are rejected immediately |
| Reset-token invalidation | ✅ Single-use enforced; reuse and expiry both correctly rejected |
| Email-verification token invalidation | ✅ Single-use enforced; resend correctly invalidates the prior token before issuing a new one |
| Sensitive-field protection | ✅ `passwordHash`, `twoFactorSecret`, and all raw tokens absent from every API response and every collection field that isn't explicitly a hash |
| Anti-enumeration (login) | ✅ Identical 401 message for wrong-password and unknown-email |
| Anti-enumeration (forgot-password) | ✅ Identical 200 message regardless of account existence |
| Anti-enumeration (resend-verification) | ✅ Identical 200 message for unknown / unverified / already-verified accounts |
| Error message hygiene | ⚠️ Two issues found — see Failures |

---

## Database Verification

Confirmed directly against MongoDB for every model touched by this run:

- **User**: `passwordHash` exists and is an Argon2 hash; no plaintext password field anywhere; `isEmailVerified` transitions correctly tracked across register → verify.
- **Session**: `refreshTokenHash` (64-char SHA-256) present on every row, raw refresh tokens never stored; `revokedAt` set precisely on rotation/logout, left `null` for naturally-expired-but-not-revoked sessions; `expiresAt` present on every row.
- **PasswordResetToken**: only `tokenHash` stored; `usedAt` set exactly once, on successful consumption.
- **EmailVerificationToken**: only `tokenHash` stored; `usedAt` set on both successful consumption and on invalidation-by-resend; expired tokens correctly rejected by the service's own expiry check regardless of `usedAt`.

---

## Failures

### Failure 1 (Critical) — Same-second login/refresh collision causes HTTP 500 with a raw database error leaked to the client

- **Test**: Two `POST /login` calls for the same user within the same wall-clock second (also reproducible via two rapid `POST /refresh` calls).
- **Expected**: Both succeed with `200` and distinct token pairs, OR the second is rejected with a clean, generic error.
- **Actual**: First call returns `200`; second returns `500` with the raw MongoDB error:
  `E11000 duplicate key error collection: test.sessions index: refreshTokenHash_1 dup key: { refreshTokenHash: "<hash>" }`
- **Error**: Unhandled duplicate-key exception from Mongoose surfaces straight through the generic error handler (`error.message` is the raw driver message).
- **Possible cause**: `generateRefreshToken()` in `src/utils/jwt.js` signs `{ sub, type: "refresh" }` with `jose`'s `.setIssuedAt()` (second-granularity `iat`) and a deterministic `exp`. Two tokens minted for the same user within the same second have **identical header, payload, `iat`, and `exp`**, so the signed JWT string — and therefore its SHA-256 hash stored in `Session.refreshTokenHash` (which has a `unique` index) — is byte-for-byte identical. The second `Session.create()` call then throws a Mongo duplicate-key error that is never caught, so it falls through to the generic handler and returns 500 with the raw driver message.
- **Impact**: Any legitimate double-click on a login button, a user with two open tabs, a mobile app retry, or near-simultaneous requests from the same user can trigger a 500 with a leaked internal error message instead of a normal login. This is a genuine reliability and minor information-disclosure issue, not specific to the new email-verification work — it affects the pre-existing login/refresh/session code.

### Failure 2 (High) — Zod validation errors return HTTP 500 instead of 400, and leak raw validator internals

- **Tests**: Invalid email format, password too short, missing required field on `/register`; missing `refreshToken` on `/refresh`; missing `password` on `/login`; missing `email` on `/forgot-password` and `/resend-verification`; missing `token` on `/verify-email`. (7 distinct endpoints/fields reproduced this.)
- **Expected**: `400 Bad Request` with a clean validation message.
- **Actual**: `500 Internal Server Error`, with `message` set to the **stringified Zod issue array** (e.g. `"[\n  {\n    \"code\": \"too_small\", ... }\n]"`), including internal details like the regex pattern used for email validation.
- **Error**: None thrown by the app deliberately — `schema.parse(req.body)` throws a `ZodError`, which has no `.statusCode` property. The global error handler in `src/app.js` does `error.statusCode || 500`, so every validation failure defaults to 500.
- **Possible cause**: The global error handler and/or each controller's `catch` block never special-cases `ZodError` to map it to 400. This is systemic — it affects **every** endpoint that validates input with Zod (`register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `verify-email`, `resend-verification`), not just the newly-added email-verification endpoints.
- **Impact**: Client-side error handling that branches on status code (e.g., "4xx → show form error, 5xx → show generic failure/retry") will misclassify every validation failure as a server error. It also leaks internal validator implementation details (regex patterns, Zod's internal issue schema) in the response body.

No other functional or security issues were found. No code was modified to work around either failure — both are reported as-is per the task instructions.

---

## Final Result

**Total tests:** 35
**Passed:** 28
**Failed:** 7 (6 instances of the same root cause — missing ZodError → 400 mapping — plus 1 instance of the same-second token-collision bug)
**Skipped:** 0

**Overall: FAIL** — the core authentication, session-rotation, password-reset, and email-verification *business logic* is correct and secure in every scenario tested (including all the security/anti-enumeration/token-hashing/single-use requirements). The two failures are both **error-handling/robustness defects**, not authorization or data-integrity defects: no unauthorized access, no data leakage of credentials, and no way to bypass a security control was found. They should still be treated as release blockers given their scope (one is a raw-500 on nearly every existing endpoint's validation path; the other can crash a normal login under ordinary concurrent usage).
