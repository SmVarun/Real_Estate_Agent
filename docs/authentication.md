# AI Sales CRM + RAG Agent — Authentication Architecture

## 1. Purpose

This document defines the authentication and authorization architecture for the AI Sales CRM + RAG Agent.

Authentication is responsible for:

* User registration
* User login
* Password security
* JWT-based authentication
* Session management
* Logout
* Password reset
* Email verification
* Two-factor authentication
* Protected API access
* Role-based authorization
* Company/tenant isolation

The authentication system is implemented through the Node.js + Express backend.

```text
React Client
     │
     ▼
Express API
     │
     ▼
Authentication Layer
     │
     ├── User Database
     ├── JWT
     ├── Session / Refresh Token
     └── Authorization
```

---

# 2. Authentication Principles

The authentication system follows these principles:

```text
1. Never trust authentication information from the frontend.
2. Passwords must never be stored in plaintext.
3. Protected APIs require authentication.
4. Authorization must be checked server-side.
5. Company/tenant identity must come from authenticated context.
6. JWT secrets must never be exposed to the frontend.
7. AI/RAG services must receive authenticated company context.
8. Authentication failures must not leak sensitive information.
```

---

# 3. Authentication Architecture

```text
                         React Client
                              │
                              │
                       Login / Register
                              │
                              ▼
                    ┌──────────────────┐
                    │   Express API    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Auth Controller  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Auth Service   │
                    └───────┬──────────┘
                            │
                ┌───────────┼────────────┐
                │           │            │
                ▼           ▼            ▼
           User DB       Password       JWT
                         Hashing
                            │
                            ▼
                      Session / Token
```

---

# 4. Authentication Flow

The overall authentication flow is:

```text
User
 │
 ▼
Register / Login
 │
 ▼
Express API
 │
 ▼
Validate Request
 │
 ▼
Authentication Service
 │
 ▼
Verify Credentials
 │
 ▼
Generate Authentication Credentials
 │
 ▼
Return Authentication Response
 │
 ▼
Frontend
 │
 ▼
Protected API Requests
 │
 ▼
JWT Middleware
 │
 ▼
Authenticated User Context
```

---

# 5. User Registration

## Flow

```text
User
 │
 ▼
POST /api/v1/auth/register
 │
 ▼
Validate Input
 │
 ▼
Check Email
 │
 ├── Already Exists → Reject
 │
 └── Available
       │
       ▼
   Hash Password
       │
       ▼
   Create Company
       │
       ▼
   Create User
       │
       ▼
   Assign ADMIN Role
       │
       ▼
   Email Verification
       │
       ▼
   Return Registration Response
```

---

# 6. Registration Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "strong-password",
  "companyName": "Example Company"
}
```

The backend must validate:

```text
Name
Email
Password
Company Name
```

---

# 7. Password Hashing

Plaintext passwords must never be stored.

```text
Password
   │
   ▼
Password Hashing Algorithm
   │
   ▼
Password Hash
   │
   ▼
Database
```

Database:

```text
password_hash
```

Never:

```text
password
```

The exact hashing library/algorithm should be finalized during backend implementation.

---

# 8. Login Flow

```text
User
 │
 ▼
Email + Password
 │
 ▼
POST /api/v1/auth/login
 │
 ▼
Validate Input
 │
 ▼
Find User
 │
 ▼
Verify Password
 │
 ├───────────────┐
 │               │
INVALID          VALID
 │               │
 ▼               ▼
Reject       Check Account
                 │
                 ▼
             Check 2FA
                 │
          ┌──────┴──────┐
          │             │
        NO 2FA        2FA
          │             │
          │             ▼
          │         Verify OTP
          │             │
          └──────┬──────┘
                 ▼
          Generate Tokens
                 │
                 ▼
          Authentication
             Complete
```

---

# 9. Login Request

```http
POST /api/v1/auth/login
```

```json
{
  "email": "john@example.com",
  "password": "strong-password"
}
```

---

# 10. Login Response

Successful login should return the authenticated user context and authentication credentials.

Conceptually:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "companyId": "company_123"
    }
  },
  "message": "Login successful"
}
```

The exact refresh-token implementation is a Phase 1 implementation decision.

---

# 11. JWT Architecture

JWT is used to authenticate protected API requests.

Conceptual token payload:

```json
{
  "sub": "user_123",
  "companyId": "company_123",
  "role": "ADMIN"
}
```

The token should contain only information necessary to establish authenticated context.

Do not store sensitive information inside the JWT payload.

---

# 12. JWT Request Flow

```text
React
 │
 ▼
API Request
 │
 ▼
Authorization: Bearer <token>
 │
 ▼
Express
 │
 ▼
JWT Middleware
 │
 ▼
Verify Signature
 │
 ▼
Validate Expiration
 │
 ▼
Extract User Context
 │
 ▼
Resolve Company
 │
 ▼
Authorization
 │
 ▼
Controller
```

---

# 13. Authentication Middleware

Every protected route should pass through authentication middleware.

Conceptually:

```text
authenticate()
      │
      ▼
Read Authorization Header
      │
      ▼
Extract Bearer Token
      │
      ▼
Verify JWT
      │
      ▼
Validate Token
      │
      ▼
Attach User Context
      │
      ▼
next()
```

Authenticated request context:

```javascript
req.user = {
    id,
    companyId,
    role
};
```

The exact implementation will be finalized in Phase 1.

---

# 14. Protected Routes

Examples:

```text
GET    /api/v1/auth/me
GET    /api/v1/companies/me

GET    /api/v1/salespersons
POST   /api/v1/salespersons

GET    /api/v1/leads
POST   /api/v1/leads
PATCH  /api/v1/leads/:id

POST   /api/v1/documents

POST   /api/v1/conversations
POST   /api/v1/chat
```

These endpoints should require authentication unless explicitly designed as public endpoints.

---

# 15. Public Routes

Initial public authentication routes:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

All other routes should be treated as protected by default.

This follows a secure-by-default approach.

---

# 16. Role-Based Authorization

Authentication identifies the user.

Authorization determines what the user can do.

Initial roles:

```text
ADMIN
SALESPERSON
```

---

# 17. Admin Permissions

An administrator can:

```text
Company
├── View company
├── Update company
│
├── Salespersons
│   ├── Create
│   ├── View
│   ├── Update
│   └── Deactivate
│
├── Leads
│   ├── Create
│   ├── View
│   ├── Update
│   ├── Assign
│   └── Manage status
│
└── Documents
    ├── Upload
    ├── View
    └── Delete
```

---

# 18. Salesperson Permissions

A salesperson can initially:

```text
Leads
├── View assigned leads
├── Update assigned leads
└── Update lead status

Conversations
├── View permitted conversations
└── Respond to customers
```

The exact permission matrix can be expanded as the CRM grows.

---

# 19. Authorization Flow

```text
Request
 │
 ▼
JWT Authentication
 │
 ▼
User Context
 │
 ▼
Role Middleware
 │
 ▼
Permission Check
 │
 ├── Allowed
 │      │
 │      ▼
 │   Controller
 │
 └── Denied
        │
        ▼
       403
```

---

# 20. Company / Tenant Isolation

Company identity must be established from authenticated context.

```text
JWT
 │
 ▼
User ID
 │
 ▼
User Record
 │
 ▼
Company ID
 │
 ▼
Authorized Resource
```

The frontend must not be trusted to define the company.

Incorrect:

```text
GET /api/v1/leads?companyId=company_b
```

Correct:

```text
Authenticated User
        │
        ▼
      companyId
        │
        ▼
Database Query
```

---

# 21. Tenant Isolation Example

Suppose:

```text
Company A
 └── User A

Company B
 └── User B
```

User A requests:

```text
GET /api/v1/leads/lead-b
```

Backend:

```text
User A
 │
 ▼
companyId = Company A
 │
 ▼
Load lead-b
 │
 ▼
lead.companyId = Company B
 │
 ▼
Mismatch
 │
 ▼
403 / 404
```

The backend must never expose Company B's lead data.

---

# 22. Tenant Isolation in RAG

The same authentication context must be passed to the RAG layer.

```text
User
 │
 ▼
JWT
 │
 ▼
companyId
 │
 ▼
Chat API
 │
 ▼
RAG Agent
 │
 ▼
ChromaDB Filter
 │
 ▼
companyId = authenticated company
```

Therefore:

```text
Company A User
     ↓
Company A Vectors ONLY
```

The RAG layer must never perform unrestricted cross-company retrieval.

---

# 23. Logout

Logout should invalidate the active authentication session according to the final token strategy.

Conceptual flow:

```text
Client
 │
 ▼
POST /api/v1/auth/logout
 │
 ▼
Authentication Service
 │
 ▼
Revoke Session / Refresh Token
 │
 ▼
Authentication Complete
```

If access tokens are short-lived, they can naturally expire while refresh/session credentials are revoked.

The exact strategy should be finalized during Phase 1.

---

# 24. Refresh Token Strategy

If refresh tokens are implemented:

```text
Access Token
  │
  └── Short-lived

Refresh Token
  │
  └── Longer-lived
```

Flow:

```text
Access Token Expired
        │
        ▼
Refresh Token
        │
        ▼
POST /api/v1/auth/refresh
        │
        ▼
Validate Refresh Token
        │
        ▼
Issue New Access Token
```

Recommended future endpoint:

```text
POST /api/v1/auth/refresh
```

The exact rotation and storage strategy is to be finalized during implementation.

---

# 25. Refresh Token Rotation

If refresh tokens are implemented, rotation should be considered.

```text
Refresh Token A
      │
      ▼
Refresh Request
      │
      ▼
Validate Token A
      │
      ▼
Revoke Token A
      │
      ▼
Issue Token B
```

This reduces the impact of refresh-token reuse.

---

# 26. Email Verification

New accounts should support email verification.

Flow:

```text
Register
  │
  ▼
Create User
  │
  ▼
Generate Verification Token
  │
  ▼
Send Verification Email
  │
  ▼
User Opens Link
  │
  ▼
Verify Token
  │
  ▼
email_verified = true
```

Conceptual endpoint:

```text
POST /api/v1/auth/verify-email
```

Request:

```json
{
  "token": "verification-token"
}
```

---

# 27. Forgot Password

Flow:

```text
User
 │
 ▼
Forgot Password
 │
 ▼
POST /api/v1/auth/forgot-password
 │
 ▼
Find Account
 │
 ▼
Generate Reset Token
 │
 ▼
Store Secure Token
 │
 ▼
Send Reset Email
```

The response should not reveal whether an account exists.

Example:

```json
{
  "success": true,
  "data": null,
  "message": "If the account exists, a password reset process has been initiated"
}
```

---

# 28. Password Reset

```text
Reset Email
    │
    ▼
Reset Token
    │
    ▼
POST /api/v1/auth/reset-password
    │
    ▼
Validate Token
    │
    ▼
Validate New Password
    │
    ▼
Hash New Password
    │
    ▼
Update User
    │
    ▼
Invalidate Existing Sessions
```

Request:

```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

---

# 29. Two-Factor Authentication

2FA should be implemented after basic authentication is stable.

The README identifies OTP/authenticator verification as the second authentication step.

Flow:

```text
Login
 │
 ▼
Credentials Valid
 │
 ▼
2FA Enabled?
 │
 ├── NO
 │    │
 │    ▼
 │  Issue Session
 │
 └── YES
      │
      ▼
   Request OTP
      │
      ▼
   Verify OTP
      │
      ▼
   Issue Session
```

---

# 30. 2FA States

Conceptually:

```text
2FA_DISABLED
2FA_PENDING
2FA_ENABLED
```

The exact implementation and database representation should be finalized during Phase 1.

---

# 31. OTP Architecture

If OTP-based 2FA is selected:

```text
Login
 │
 ▼
Credentials Valid
 │
 ▼
Generate OTP
 │
 ▼
Temporary OTP Storage
 │
 ▼
Send OTP
 │
 ▼
User Enters OTP
 │
 ▼
Verify OTP
 │
 ▼
Issue Authentication
```

OTP values should not be stored in plaintext when persistent storage is required.

---

# 32. Account Status

Users should have a controlled account status.

Example:

```text
ACTIVE
INACTIVE
SUSPENDED
PENDING_VERIFICATION
```

Authentication should reject users whose account status does not permit login.

Example:

```text
User
 │
 ▼
Check Status
 │
 ├── ACTIVE → Continue
 │
 ├── PENDING_VERIFICATION → Verification Required
 │
 ├── SUSPENDED → Reject
 │
 └── INACTIVE → Reject
```

---

# 33. Password Policy

The backend should enforce a minimum password policy.

The exact policy should be finalized during implementation.

At minimum:

```text
Password
 ├── Minimum length
 ├── Validation
 └── Secure hashing
```

The system should not rely only on frontend password validation.

---

# 34. Authentication Error Handling

Authentication errors should not expose sensitive information.

Avoid:

```text
"Email exists but password is wrong."
```

Prefer:

```text
"Invalid email or password."
```

Similarly, forgot-password requests should not reveal whether an account exists.

---

# 35. Authentication HTTP Status Codes

Recommended statuses:

```text
400
Invalid request

401
Invalid / missing authentication

403
Authenticated but not authorized

404
Resource not found

409
Account/resource conflict

422
Validation error

429
Too many attempts

500
Internal authentication failure
```

---

# 36. Brute Force Protection

Authentication endpoints should be rate-limited.

Especially:

```text
POST /auth/login
POST /auth/register
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
```

Conceptual flow:

```text
Repeated Failed Requests
        │
        ▼
Rate Limit
        │
        ▼
Temporary Block / Slowdown
```

Exact thresholds should be configured during implementation.

---

# 37. Session Architecture

If refresh/session management is implemented, the primary database may contain:

```text
sessions
│
├── id
├── user_id
├── refresh_token_hash
├── expires_at
├── revoked_at
├── created_at
└── metadata
```

The database should store a secure representation of the refresh credential rather than unnecessarily storing raw tokens.

---

# 38. Authentication Database Relationships

```text
Company
   │
   └── Users
         │
         ├── Sessions
         │
         ├── Verification Tokens
         │
         ├── Password Reset Tokens
         │
         └── 2FA Configuration
```

Conceptually:

```text
company
   │
   ▼
user
   │
   ├── authentication state
   ├── role
   ├── sessions
   └── security metadata
```

---

# 39. Authentication API Surface

Initial API:

```text
AUTH
│
├── POST /api/v1/auth/register
├── POST /api/v1/auth/login
├── POST /api/v1/auth/logout
├── GET  /api/v1/auth/me
│
├── POST /api/v1/auth/forgot-password
├── POST /api/v1/auth/reset-password
│
├── POST /api/v1/auth/verify-email
│
└── POST /api/v1/auth/refresh
```

Future 2FA endpoints may include:

```text
POST /api/v1/auth/2fa/setup
POST /api/v1/auth/2fa/verify
POST /api/v1/auth/2fa/disable
```

The exact endpoints depend on the selected 2FA implementation.

---

# 40. Authentication Middleware Structure

Recommended backend structure:

```text
server/src/
│
├── middleware/
│   ├── authenticate.js
│   ├── authorize.js
│   └── rateLimiter.js
│
├── services/
│   ├── auth.service.js
│   ├── token.service.js
│   ├── session.service.js
│   ├── password.service.js
│   └── verification.service.js
│
├── controllers/
│   └── auth.controller.js
│
├── routes/
│   └── auth.routes.js
│
└── validators/
    └── auth.validator.js
```

---

# 41. Authentication Request Flow

General protected request:

```text
Client
 │
 ▼
HTTP Request
 │
 ▼
CORS
 │
 ▼
Rate Limiter
 │
 ▼
JWT Authentication
 │
 ▼
User Context
 │
 ▼
Tenant Context
 │
 ▼
Role Authorization
 │
 ▼
Request Validation
 │
 ▼
Controller
 │
 ▼
Service
 │
 ▼
Database
```

---

# 42. Authentication Context

After authentication, the backend should have enough information to identify:

```text
User
 │
 ├── userId
 ├── companyId
 └── role
```

Conceptually:

```javascript
req.user = {
    id: "user_123",
    companyId: "company_123",
    role: "ADMIN"
};
```

This context should be used throughout the request lifecycle.

---

# 43. Authentication and RAG Integration

Authentication is directly connected to RAG tenant isolation.

```text
Authenticated User
       │
       ▼
    companyId
       │
       ▼
    Chat API
       │
       ▼
    RAG Agent
       │
       ▼
ChromaDB Retrieval Filter
       │
       ▼
Company-specific Documents
```

This ensures that a user's AI queries only access knowledge belonging to their company.

---

# 44. Authentication and CRM Integration

The same identity context controls CRM access.

```text
Authenticated User
       │
       ▼
     companyId
       │
       ▼
      role
       │
       ▼
CRM Authorization
       │
       ├── ADMIN
       │
       └── SALESPERSON
```

Example:

```text
SALESPERSON
      │
      ▼
GET /leads/:id
      │
      ▼
Check Lead Company
      │
      ▼
Check Assignment
      │
      ▼
Allow / Reject
```

---

# 45. Security Rules

The following rules are mandatory:

```text
✓ Never store plaintext passwords
✓ Never expose JWT secrets
✓ Never expose refresh-token secrets
✓ Never trust companyId from the frontend
✓ Always authenticate protected routes
✓ Always authorize protected resources
✓ Enforce tenant isolation
✓ Rate-limit authentication endpoints
✓ Validate all authentication input
✓ Avoid account enumeration
✓ Invalidate sessions after sensitive security events
✓ Do not log passwords or tokens
✓ Do not place sensitive information in JWT payloads
```

---

# 46. Sensitive Security Events

The system should consider invalidating existing sessions after events such as:

```text
Password reset
Password change
Account suspension
Security credential change
Potential token compromise
```

The exact session invalidation strategy depends on the final token architecture.

---

# 47. Authentication Environment Variables

Authentication-related configuration should be stored in environment variables.

Example:

```text
JWT_SECRET=
JWT_EXPIRES_IN=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=

PASSWORD_RESET_TOKEN_EXPIRES_IN=
EMAIL_VERIFICATION_TOKEN_EXPIRES_IN=

AUTH_RATE_LIMIT=
```

Actual secrets must never be committed to source control.

---

# 48. Authentication Testing Strategy

Authentication should be tested at multiple levels.

## Registration

```text
✓ Valid registration
✓ Duplicate email
✓ Invalid email
✓ Weak password
✓ Missing fields
✓ Company creation
✓ User creation
```

## Login

```text
✓ Correct credentials
✓ Incorrect password
✓ Unknown email
✓ Suspended user
✓ Unverified user
✓ Expired token
✓ Invalid token
```

## Authorization

```text
✓ Admin access
✓ Salesperson access
✓ Unauthorized role
✓ Cross-company access
✓ Resource ownership
```

## Password Reset

```text
✓ Valid reset
✓ Invalid token
✓ Expired token
✓ Reused token
✓ Weak password
```

## 2FA

```text
✓ Valid OTP
✓ Invalid OTP
✓ Expired OTP
✓ Missing OTP
✓ 2FA disabled
✓ 2FA enabled
```

---

# 49. Authentication Logging

Authentication events should be logged without exposing secrets.

Useful events:

```text
USER_REGISTERED
USER_LOGIN_SUCCESS
USER_LOGIN_FAILED
USER_LOGOUT
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_COMPLETED
EMAIL_VERIFIED
2FA_ENABLED
2FA_VERIFIED
ACCOUNT_SUSPENDED
TOKEN_REFRESHED
```

Example:

```json
{
  "event": "USER_LOGIN_SUCCESS",
  "userId": "user_123",
  "companyId": "company_123",
  "requestId": "req_123",
  "timestamp": "..."
}
```

Never log:

```text
password
JWT
refresh token
OTP
API key
secret
```

---

# 50. Authentication Architecture Summary

```text
                         USER
                          │
                          ▼
                    React Client
                          │
                          ▼
                   Express API
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
       Authentication             Protected API
              │                       │
       ┌──────┼──────┐                │
       │      │      │                │
       ▼      ▼      ▼                ▼
    Password  JWT   Session       Authorization
       │             │                │
       └──────┬──────┘                │
              │                       │
              ▼                       ▼
          User Context ────────► companyId + role
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                       CRM                       RAG
                         │                         │
                         ▼                         ▼
                    Primary DB                 ChromaDB
```

---

# 51. Phase 0 Authentication Deliverables

Before Phase 1 implementation begins, the following must be finalized:

```text
✓ Registration flow
✓ Login flow
✓ JWT strategy
✓ Access-token strategy
✓ Refresh-token strategy
✓ Logout strategy
✓ Password hashing strategy
✓ Password reset flow
✓ Email verification flow
✓ 2FA strategy
✓ Session strategy
✓ User roles
✓ Authorization rules
✓ Tenant isolation
✓ Authentication middleware
✓ Authorization middleware
✓ Rate limiting
✓ Security logging
✓ Authentication API contract
✓ Authentication environment variables
✓ Authentication test cases
```

---

# 52. Definition of Done

Authentication architecture is complete when:

```text
User
 │
 ▼
Register
 │
 ▼
Verify Account
 │
 ▼
Login
 │
 ▼
2FA (if enabled)
 │
 ▼
Authentication Credentials
 │
 ▼
Protected API
 │
 ▼
JWT Validation
 │
 ▼
User + Company + Role Context
 │
 ▼
Authorization
 │
 ▼
CRM / RAG / Chat
```

The system must ensure:

```text
Authentication
     +
Authorization
     +
Tenant Isolation
     +
Secure Credential Handling
```

before any user can access protected CRM or AI functionality.

After this document is approved:

```text
PHASE 0
Architecture + Authentication Design
              │
              ▼
       AUTHENTICATION FREEZE
              │
              ▼
PHASE 1
Backend + Authentication Implementation
```
