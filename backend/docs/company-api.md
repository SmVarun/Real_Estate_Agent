# Company API Documentation

**API Version:** v1  
**Base URL:** `http://localhost:3000/api/v1`  
**Authentication:** httpOnly `accessToken` cookie  
**Authorization:** ADMIN only

---

# Overview

The application supports a **single-company architecture**.

Only one Company document can exist in the database.

The Company profile is created through the onboarding endpoint and becomes the **single source of truth** for company information across the application.

All Company APIs require:

1. A valid `accessToken` cookie
2. The authenticated user to have the `ADMIN` role

> The canonical role value stored in MongoDB is `admin` (lowercase).
>
> `/register` never accepts a `role` — that would let anyone self-assign
> admin. Every account starts on `sales_rep`. Grant admin with either
> `PATCH /api/v1/users/:id/role` (admin-only) or, for the first admin,
> `node scripts/promote-user.js <email> admin`.

---

# Authentication

Authentication is cookie-based. The browser sends the `accessToken` cookie
automatically, provided the request opts into credentials:

```js
fetch("/api/v1/company", { credentials: "include" })   // or axios withCredentials
```

There is no `Authorization` header in this API. If a request arrives without the
cookie the response is `401`, and a cross-origin call made *without* credentials
enabled looks exactly like that — the browser simply omits the cookie. See
`auth-api.md` for the full flow.

-------------------------------------------------------------------------------------

Authorization

Company APIs are restricted to administrators.

User	Access
Unauthenticated	❌
Normal authenticated user	❌
ADMIN	✅

Expected responses:

Unauthenticated
401 Unauthorized
Authenticated but not ADMIN
403 Forbidden
Endpoints
Method	Endpoint	Auth	Role	Purpose
POST	/api/v1/company/onboarding	JWT	ADMIN	Create the company
GET	/api/v1/company	JWT	ADMIN	Get company profile
PATCH	/api/v1/company	JWT	ADMIN	Update company profile
1. Company Onboarding

Creates the single company profile.

Request
POST /api/v1/company/onboarding
Headers
Content-Type: application/json
Cookie: accessToken=<ADMIN_ACCESS_TOKEN>
Request Body
{
  "businessName": "Tech Yantra Solutions",
  "legalName": "Tech Yantra Solutions Private Limited",
  "industry": "Software Development",
  "description": "A technology company focused on building scalable web, mobile, and AI-powered applications.",
  "website": "https://techyantra.example.com",
  "email": "contact@techyantra.example.com",
  "phone": "+919876543210",
  "logo": "https://techyantra.example.com/logo.png",
  "address": {
    "street": "MG Road",
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "postalCode": "110001"
  },
  "socialLinks": {
    "linkedin": "https://www.linkedin.com/company/techyantra",
    "twitter": "https://twitter.com/techyantra",
    "facebook": "https://www.facebook.com/techyantra",
    "instagram": "https://www.instagram.com/techyantra"
  },
  "foundedYear": 2024,
  "employeeCount": 25
}
Required Fields
businessName
legalName
industry
description
email
phone
address
Address
street
city
state
country
postalCode
Optional Fields
website
logo
socialLinks
foundedYear
employeeCount
Success Response
201 Created
{
  "success": true,
  "message": "Company onboarded successfully",
  "data": {
    "_id": "64xxxxxxxxxxxxxxxxxxxxxx",
    "businessName": "Tech Yantra Solutions",
    "legalName": "Tech Yantra Solutions Private Limited",
    "industry": "Software Development",
    "description": "A technology company focused on building scalable web, mobile, and AI-powered applications.",
    "website": "https://techyantra.example.com",
    "email": "contact@techyantra.example.com",
    "phone": "+919876543210",
    "logo": "https://techyantra.example.com/logo.png",
    "address": {
      "street": "MG Road",
      "city": "New Delhi",
      "state": "Delhi",
      "country": "India",
      "postalCode": "110001"
    },
    "socialLinks": {
      "linkedin": "https://www.linkedin.com/company/techyantra",
      "twitter": "https://twitter.com/techyantra",
      "facebook": "https://www.facebook.com/techyantra",
      "instagram": "https://www.instagram.com/techyantra"
    },
    "foundedYear": 2024,
    "employeeCount": 25,
    "onboardingCompleted": true,
    "createdAt": "2026-08-19T10:00:00.000Z",
    "updatedAt": "2026-08-19T10:00:00.000Z"
  }
}
Company Singleton Protection

Only one company can exist.

If onboarding is attempted after the company already exists:

409 Conflict
{
  "success": false,
  "message": "Company has already been onboarded",
  "data": null
}

The frontend should redirect the user to the existing company profile instead of showing the onboarding form again.

2. Get Company Profile

Retrieves the single company profile.

Request
GET /api/v1/company
Headers
Cookie: accessToken=<ADMIN_ACCESS_TOKEN>

No request body is required.

Success Response
200 OK
{
  "success": true,
  "message": "Company retrieved successfully",
  "data": {
    "_id": "64xxxxxxxxxxxxxxxxxxxxxx",
    "businessName": "Tech Yantra Solutions",
    "legalName": "Tech Yantra Solutions Private Limited",
    "industry": "Software Development",
    "description": "A technology company focused on building scalable web, mobile, and AI-powered applications.",
    "website": "https://techyantra.example.com",
    "email": "contact@techyantra.example.com",
    "phone": "+919876543210",
    "logo": "https://techyantra.example.com/logo.png",
    "address": {
      "street": "MG Road",
      "city": "New Delhi",
      "state": "Delhi",
      "country": "India",
      "postalCode": "110001"
    },
    "socialLinks": {
      "linkedin": "https://www.linkedin.com/company/techyantra",
      "twitter": "https://twitter.com/techyantra",
      "facebook": "https://www.facebook.com/techyantra",
      "instagram": "https://www.instagram.com/techyantra"
    },
    "foundedYear": 2024,
    "employeeCount": 25,
    "onboardingCompleted": true,
    "createdAt": "2026-08-19T10:00:00.000Z",
    "updatedAt": "2026-08-19T10:00:00.000Z"
  }
}
Company Not Onboarded

If no company has been created:

404 Not Found
{
  "success": false,
  "message": "Company has not been onboarded",
  "data": null
}
3. Update Company Profile

Updates the existing company profile.

Request
PATCH /api/v1/company
Headers
Content-Type: application/json
Cookie: accessToken=<ADMIN_ACCESS_TOKEN>

Only fields that need to be changed need to be included.

Example
{
  "description": "Updated company description.",
  "website": "https://new-website.example.com",
  "employeeCount": 35
}
Success Response
200 OK
{
  "success": true,
  "message": "Company updated successfully",
  "data": {
    "_id": "64xxxxxxxxxxxxxxxxxxxxxx",
    "businessName": "Tech Yantra Solutions",
    "legalName": "Tech Yantra Solutions Private Limited",
    "industry": "Software Development",
    "description": "Updated company description.",
    "website": "https://new-website.example.com",
    "employeeCount": 35,
    "onboardingCompleted": true,
    "createdAt": "2026-08-19T10:00:00.000Z",
    "updatedAt": "2026-08-19T11:00:00.000Z"
  }
}
Validation Errors

Invalid request data returns:

400 Bad Request

Example:

{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid company email"
    }
  ]
}

The exact validation error structure follows the backend's centralized Zod error handling.

Authentication Errors
Missing/Invalid Token
401 Unauthorized
{
  "success": false,
  "message": "Authentication required"
}

or the corresponding existing authentication error response.

Authorization Errors
Non-Admin User
403 Forbidden
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
Company Data Rules

The frontend must NOT send or attempt to modify:

singletonKey
onboardingCompleted
createdAt
updatedAt
_id

These are controlled by the backend.

Frontend Onboarding Flow
User Login
    ↓
Receive Access Token
    ↓
Check Company
    ↓
GET /api/v1/company
    ↓
Company exists?
   ┌──────────────┴──────────────┐
   │                             │
  YES                            NO
   │                             │
   ▼                             ▼
Dashboard                 Company Onboarding
                                │
                                ▼
                     POST /company/onboarding
                                │
                                ▼
                         Company Created
                                │
                                ▼
                            Dashboard
Frontend Authorization Flow

The frontend should not rely solely on hiding the onboarding page.

The backend enforces:

JWT Authentication
       ↓
ADMIN Authorization
       ↓
Company API

Therefore, even if a normal user manually calls the endpoint, the backend rejects the request.

Frontend Integration Checklist
[ ] Login as ADMIN
[ ] Enable credentials on the HTTP client (nothing to store — cookies are httpOnly)
[ ] Call GET /api/v1/company
[ ] Handle 404 when company is not onboarded
[ ] Show company onboarding form
[ ] Submit POST /api/v1/company/onboarding
[ ] Handle 201 response
[ ] Redirect to dashboard
[ ] Prevent duplicate onboarding UI
[ ] Handle 409 response
[ ] Load company profile
[ ] Implement company profile editing
[ ] Submit PATCH /api/v1/company
[ ] Handle 400 validation errors
[ ] Handle 401 authentication errors
[ ] Handle 403 authorization errors
Postman Examples
Onboard
curl -X POST http://localhost:3000/api/v1/company/onboarding \
  -H "Content-Type: application/json" \
  -b "accessToken=<ADMIN_ACCESS_TOKEN>" \
  -d '{
    "businessName": "Tech Yantra Solutions",
    "legalName": "Tech Yantra Solutions Private Limited",
    "industry": "Software Development",
    "description": "A technology company focused on scalable applications.",
    "website": "https://techyantra.example.com",
    "email": "contact@techyantra.example.com",
    "phone": "+919876543210",
    "address": {
      "street": "MG Road",
      "city": "New Delhi",
      "state": "Delhi",
      "country": "India",
      "postalCode": "110001"
    },
    "foundedYear": 2024,
    "employeeCount": 25
  }'
Get Company
curl http://localhost:3000/api/v1/company \
  -b "accessToken=<ADMIN_ACCESS_TOKEN>"
Update Company
curl -X PATCH http://localhost:3000/api/v1/company \
  -H "Content-Type: application/json" \
  -b "accessToken=<ADMIN_ACCESS_TOKEN>" \
  -d '{
    "description": "Updated company description."
  }'
Security Notes
Company APIs read the accessToken cookie; the refreshToken cookie is used only by POST /api/v1/auth/refresh.
Both cookies are httpOnly, so client script cannot read them — do not add code that tries. Never log token values server-side.
Company APIs are ADMIN-only.
The frontend must not attempt to control onboardingCompleted.
The frontend must not send singletonKey.
The backend is responsible for enforcing the single-company constraint.
Use HTTPS in production.
Do not store sensitive credentials in frontend source code.
Company Architecture

The Company profile is the canonical source of truth for the business.

Future CRM entities will build around it:

                 Company
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Products  Contacts    Leads
                              │
                              ▼
                            Deals
                              │
                              ▼
                         Activities

Future company documents and AI/RAG functionality can use the Company profile as part of the company's knowledge base.

Current Status

Company Onboarding: COMPLETE

Single-company architecture
ADMIN-only access
JWT authentication
Company onboarding
Company retrieval
Company update
Singleton protection
Zod validation
Standardized responses
Authorization testing
Postman testing