# AI Sales CRM + RAG Agent — API Specification

## 1. Purpose

This document defines the REST API architecture and conventions for the AI Sales CRM + RAG Agent.

The API acts as the primary communication layer between:

```text
React Frontend
      │
      ▼
Node.js / Express API
      │
      ├── Primary Database
      ├── RAG System
      ├── ChromaDB
      ├── File Storage
      └── AI / LLM
```

The frontend must communicate with the backend through the API.

The frontend must not directly communicate with:

* Primary database
* ChromaDB
* LLM provider
* Internal RAG services
* File storage credentials

---

# 2. API Architecture

```text
                         React Client
                              │
                              ▼
                       REST API /api/v1
                              │
                              ▼
                    Node.js + Express
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
       Auth API            CRM API             AI API
          │                   │                   │
          ▼                   ▼                   ▼
       Users              Leads/CRM             RAG
                                                  │
                                      ┌───────────┴───────────┐
                                      ▼                       ▼
                                  ChromaDB                   LLM
```

---

# 3. API Versioning

All production API routes should be versioned.

Base URL:

```text
/api/v1
```

Example:

```text
/api/v1/auth/login
/api/v1/leads
/api/v1/documents
/api/v1/chat
```

This allows future versions to coexist without immediately breaking existing clients.

---

# 4. API Modules

The initial API should be organized into the following modules:

```text
/api/v1
│
├── /auth
├── /users
├── /companies
├── /salespersons
├── /leads
├── /documents
├── /conversations
└── /chat
```

Future modules may include:

```text
/api/v1
│
├── /analytics
├── /notifications
├── /webhooks
└── /whatsapp
```

These are outside the initial MVP API scope.

---

# 5. HTTP Methods

The API follows standard HTTP semantics.

| Method | Purpose                               |
| ------ | ------------------------------------- |
| GET    | Retrieve resources                    |
| POST   | Create resources / execute operations |
| PATCH  | Partially update resources            |
| PUT    | Replace a resource where required     |
| DELETE | Remove a resource                     |

Examples:

```text
GET     /api/v1/leads
GET     /api/v1/leads/:id

POST    /api/v1/leads

PATCH   /api/v1/leads/:id

DELETE  /api/v1/leads/:id
```

---

# 6. Authentication

Protected APIs use JWT-based authentication.

Request:

```http
Authorization: Bearer <access_token>
```

Flow:

```text
Client
  │
  ▼
Login
  │
  ▼
Express
  │
  ▼
Validate Credentials
  │
  ▼
Generate JWT
  │
  ▼
Client
  │
  ▼
Protected API
  │
  ▼
JWT Middleware
  │
  ▼
Authenticated User
```

---

# 7. Authentication Middleware

Every protected request should pass through:

```text
Request
   │
   ▼
Extract JWT
   │
   ▼
Verify JWT
   │
   ▼
Identify User
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

The middleware should make authenticated context available to the request.

Conceptually:

```javascript
req.user = {
    id,
    companyId,
    role
};
```

The exact implementation can be finalized during Phase 1.

---

# 8. Standard Response Format

Successful responses should follow a consistent structure.

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Example:

```json
{
  "success": true,
  "data": {
    "id": "lead_123",
    "name": "John Doe"
  },
  "message": "Lead created successfully"
}
```

---

# 9. Error Response Format

Errors should use a standardized structure.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "LEAD_NOT_FOUND",
    "message": "Lead does not exist",
    "details": {}
  }
}
```

---

# 10. HTTP Status Codes

Recommended status codes:

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 200    | Successful request                       |
| 201    | Resource created                         |
| 204    | Successful request with no response body |
| 400    | Invalid request                          |
| 401    | Authentication required / invalid        |
| 403    | Insufficient permissions                 |
| 404    | Resource not found                       |
| 409    | Conflict                                 |
| 422    | Validation failure                       |
| 429    | Rate limit exceeded                      |
| 500    | Internal server error                    |
| 502    | External service failure                 |
| 503    | Service unavailable                      |

---

# 11. Authentication API

## 11.1 Register

```http
POST /api/v1/auth/register
```

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "strong-password",
  "companyName": "Example Company"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN"
    }
  },
  "message": "Registration successful"
}
```

---

# 12. Login

```http
POST /api/v1/auth/login
```

### Request

```json
{
  "email": "john@example.com",
  "password": "strong-password"
}
```

### Successful Response

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

The exact refresh-token strategy will be finalized during authentication implementation.

---

# 13. Logout

```http
POST /api/v1/auth/logout
```

### Authentication

Required.

### Response

```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

---

# 14. Forgot Password

```http
POST /api/v1/auth/forgot-password
```

### Request

```json
{
  "email": "john@example.com"
}
```

### Response

```json
{
  "success": true,
  "data": null,
  "message": "If the account exists, a password reset process has been initiated"
}
```

The API should avoid exposing whether an email belongs to an account.

---

# 15. Reset Password

```http
POST /api/v1/auth/reset-password
```

### Request

```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

### Response

```json
{
  "success": true,
  "data": null,
  "message": "Password reset successful"
}
```

---

# 16. Current User

```http
GET /api/v1/auth/me
```

### Authentication

Required.

### Response

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",
    "companyId": "company_123"
  },
  "message": "User retrieved successfully"
}
```

---

# 17. Company API

The company API manages tenant/company information.

## Get Company

```http
GET /api/v1/companies/me
```

### Authentication

Required.

### Response

```json
{
  "success": true,
  "data": {
    "id": "company_123",
    "name": "Example Company",
    "status": "ACTIVE"
  },
  "message": "Company retrieved successfully"
}
```

---

# 18. Update Company

```http
PATCH /api/v1/companies/me
```

### Authentication

Required.

### Authorization

Admin only.

### Request

```json
{
  "name": "Updated Company Name"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "company_123",
    "name": "Updated Company Name"
  },
  "message": "Company updated successfully"
}
```

---

# 19. Salesperson API

Salespersons are CRM users responsible for handling leads.

## List Salespersons

```http
GET /api/v1/salespersons
```

### Query Parameters

```text
?page=1
&limit=20
&status=ACTIVE
&search=john
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  },
  "message": "Salespersons retrieved successfully"
}
```

---

# 20. Create Salesperson

```http
POST /api/v1/salespersons
```

### Authorization

Admin only.

### Request

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91XXXXXXXXXX",
  "role": "SALESPERSON"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "salesperson_123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "status": "ACTIVE"
  },
  "message": "Salesperson created successfully"
}
```

---

# 21. Get Salesperson

```http
GET /api/v1/salespersons/:id
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "salesperson_123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91XXXXXXXXXX",
    "status": "ACTIVE",
    "assignedLeadCount": 10
  },
  "message": "Salesperson retrieved successfully"
}
```

---

# 22. Update Salesperson

```http
PATCH /api/v1/salespersons/:id
```

### Request

```json
{
  "name": "Jane Updated",
  "phone": "+91XXXXXXXXXX",
  "status": "ACTIVE"
}
```

---

# 23. Delete / Deactivate Salesperson

For CRM data safety, deactivation is preferred over hard deletion.

```http
PATCH /api/v1/salespersons/:id/status
```

### Request

```json
{
  "status": "INACTIVE"
}
```

---

# 24. Lead API

Leads are one of the primary CRM resources.

## List Leads

```http
GET /api/v1/leads
```

### Query Parameters

```text
?page=1
&limit=20
&status=INTERESTED
&interestLevel=HIGH
&salespersonId=salesperson_123
&source=WEBSITE
&search=john
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  },
  "message": "Leads retrieved successfully"
}
```

---

# 25. Create Lead

```http
POST /api/v1/leads
```

### Authentication

Required.

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91XXXXXXXXXX",
  "productInterest": "Product X",
  "interestLevel": "HIGH",
  "source": "WEBSITE",
  "notes": "Interested in pricing"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "lead_123",
    "name": "John Doe",
    "status": "NEW",
    "interestLevel": "HIGH"
  },
  "message": "Lead created successfully"
}
```

---

# 26. Get Lead

```http
GET /api/v1/leads/:id
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "lead_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91XXXXXXXXXX",
    "productInterest": "Product X",
    "interestLevel": "HIGH",
    "status": "INTERESTED",
    "assignedSalesperson": {},
    "lastInteractionAt": null
  },
  "message": "Lead retrieved successfully"
}
```

---

# 27. Update Lead

```http
PATCH /api/v1/leads/:id
```

### Request

```json
{
  "status": "QUALIFIED",
  "interestLevel": "HIGH",
  "notes": "Customer qualified"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "lead_123",
    "status": "QUALIFIED",
    "interestLevel": "HIGH"
  },
  "message": "Lead updated successfully"
}
```

---

# 28. Assign Lead

```http
POST /api/v1/leads/:id/assign
```

### Request

```json
{
  "salespersonId": "salesperson_123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "leadId": "lead_123",
    "salespersonId": "salesperson_123"
  },
  "message": "Lead assigned successfully"
}
```

Initially, assignment can be manual.

Automatic assignment can be introduced later.

---

# 29. Change Lead Status

```http
PATCH /api/v1/leads/:id/status
```

### Request

```json
{
  "status": "HIGHLY_INTERESTED"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "lead_123",
    "status": "HIGHLY_INTERESTED"
  },
  "message": "Lead status updated successfully"
}
```

---

# 30. Lead Lifecycle

The API should enforce the allowed lifecycle:

```text
NEW
 │
 ▼
CONTACTED
 │
 ▼
INTERESTED
 │
 ▼
HIGHLY_INTERESTED
 │
 ▼
QUALIFIED
 │
 ▼
CONVERTED
```

Alternative states:

```text
NOT_INTERESTED
LOST
```

Invalid transitions should return a validation/business-rule error.

---

# 31. Dashboard API

The CRM dashboard requires aggregated information.

```http
GET /api/v1/dashboard/overview
```

### Response

```json
{
  "success": true,
  "data": {
    "totalLeads": 100,
    "newLeads": 20,
    "interestedLeads": 30,
    "highlyInterestedLeads": 10,
    "qualifiedLeads": 15,
    "convertedLeads": 25,
    "salespersonCount": 8,
    "assignedLeads": 80,
    "unassignedLeads": 20,
    "recentActivity": []
  },
  "message": "Dashboard data retrieved successfully"
}
```

The exact analytics queries can be optimized during implementation.

---

# 32. Document API

Documents represent company knowledge uploaded for the RAG system.

## Upload Document

```http
POST /api/v1/documents
```

### Content Type

```text
multipart/form-data
```

### Form Fields

```text
file
documentType
```

Example:

```text
file = product-guide.pdf
documentType = PRODUCT
```

### Flow

```text
Upload
  │
  ▼
Validate File
  │
  ▼
Store Original File
  │
  ▼
Create Document Record
  │
  ▼
Start Ingestion
  │
  ▼
Return Document
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "document_123",
    "filename": "product-guide.pdf",
    "documentType": "PRODUCT",
    "status": "PROCESSING"
  },
  "message": "Document uploaded successfully"
}
```

---

# 33. List Documents

```http
GET /api/v1/documents
```

### Query Parameters

```text
?page=1
&limit=20
&status=INDEXED
&documentType=PRODUCT
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  },
  "message": "Documents retrieved successfully"
}
```

---

# 34. Get Document

```http
GET /api/v1/documents/:id
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "document_123",
    "filename": "product-guide.pdf",
    "documentType": "PRODUCT",
    "status": "INDEXED",
    "createdAt": "..."
  },
  "message": "Document retrieved successfully"
}
```

---

# 35. Delete Document

```http
DELETE /api/v1/documents/:id
```

Deletion should trigger cleanup of:

```text
Original file
     +
Document metadata
     +
ChromaDB vectors
```

Flow:

```text
DELETE /documents/:id
        │
        ▼
Validate Ownership
        │
        ▼
Remove Vectors
        │
        ▼
Remove File
        │
        ▼
Remove Metadata
```

---

# 36. Document Processing Status

```http
GET /api/v1/documents/:id/status
```

### Response

```json
{
  "success": true,
  "data": {
    "documentId": "document_123",
    "status": "INDEXED",
    "progress": 100
  },
  "message": "Document status retrieved successfully"
}
```

The exact progress mechanism can be refined during implementation.

---

# 37. Conversation API

## Create Conversation

```http
POST /api/v1/conversations
```

### Request

```json
{
  "leadId": "lead_123",
  "channel": "INTERNAL_CHAT"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "conversation_123",
    "leadId": "lead_123",
    "channel": "INTERNAL_CHAT",
    "status": "ACTIVE"
  },
  "message": "Conversation created successfully"
}
```

---

# 38. List Conversations

```http
GET /api/v1/conversations
```

### Query Parameters

```text
?page=1
&limit=20
&leadId=lead_123
&status=ACTIVE
&channel=INTERNAL_CHAT
```

---

# 39. Get Conversation

```http
GET /api/v1/conversations/:id
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "conversation_123",
    "leadId": "lead_123",
    "channel": "INTERNAL_CHAT",
    "status": "ACTIVE",
    "messages": []
  },
  "message": "Conversation retrieved successfully"
}
```

---

# 40. Send Chat Message

The main AI endpoint is:

```http
POST /api/v1/chat
```

### Authentication

Required.

### Request

```json
{
  "conversationId": "conversation_123",
  "message": "What are the features of Product X?"
}
```

### Backend Flow

```text
Request
  │
  ▼
Authentication
  │
  ▼
Identify Company
  │
  ▼
Load Conversation
  │
  ▼
Store User Message
  │
  ▼
RAG Agent
  │
  ▼
Generate Question Embedding
  │
  ▼
Retrieve Company-specific Context
  │
  ▼
Build Prompt
  │
  ▼
LLM
  │
  ▼
Generate Answer
  │
  ▼
Store AI Message
  │
  ▼
Return Response
```

---

# 41. Chat Response

```json
{
  "success": true,
  "data": {
    "answer": "Product X provides ...",
    "conversationId": "conversation_123",
    "sources": [
      {
        "documentId": "document_123",
        "page": 4,
        "source": "product-guide.pdf"
      }
    ],
    "metadata": {
      "retrievalCount": 5,
      "confidence": {}
    }
  },
  "message": "Response generated successfully"
}
```

---

# 42. RAG Query Contract

Internally, the API should send the RAG service information similar to:

```json
{
  "companyId": "company_123",
  "conversationId": "conversation_123",
  "message": "What are the features of Product X?"
}
```

The RAG system should use `companyId` to enforce tenant isolation.

---

# 43. RAG Retrieval Flow

```text
User Question
      │
      ▼
Question Embedding
      │
      ▼
ChromaDB
      │
      ├── company_id filter
      │
      ▼
Similarity Search
      │
      ▼
Top-K Chunks
      │
      ▼
Context
```

---

# 44. AI Response Rules

The RAG agent should:

```text
✓ Use retrieved company knowledge
✓ Prefer company-specific information
✓ Provide source references where available
✓ Avoid inventing company information
✓ Clearly state when information is unavailable
```

The API should not treat an LLM-generated answer as automatically trustworthy.

---

# 45. AI → CRM API Contract

The AI should communicate structured intent to the backend.

Example:

```json
{
  "intent": "PURCHASE",
  "interest": "HIGH",
  "callbackRequired": true,
  "product": "Product X"
}
```

Flow:

```text
AI
 │
 ▼
Structured Output
 │
 ▼
Schema Validation
 │
 ▼
Business Validation
 │
 ▼
CRM Service
 │
 ▼
Lead Create / Update
```

The LLM must not receive direct database credentials or unrestricted database tools.

---

# 46. Internal CRM Intelligence Endpoint

A future internal endpoint may expose AI classification separately:

```http
POST /api/v1/leads/:id/analyze
```

Possible response:

```json
{
  "success": true,
  "data": {
    "intent": "PURCHASE",
    "interestLevel": "HIGH",
    "callbackRequired": true,
    "recommendation": "Assign salesperson"
  },
  "message": "Lead analyzed successfully"
}
```

This endpoint should only be introduced if the implementation requires explicit on-demand lead analysis.

---

# 47. Pagination

Collection endpoints should support pagination.

Recommended query:

```text
?page=1&limit=20
```

Response:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

The server should enforce a maximum page size.

Example:

```text
limit <= 100
```

The exact maximum can be finalized during implementation.

---

# 48. Filtering

Filtering should use query parameters.

Example:

```text
GET /api/v1/leads?status=INTERESTED&interestLevel=HIGH
```

Possible filters:

```text
status
interestLevel
salespersonId
source
createdAt
updatedAt
```

Filtering must always respect the authenticated user's company.

---

# 49. Sorting

Collections should support controlled sorting.

Example:

```text
GET /api/v1/leads?sortBy=createdAt&sortOrder=desc
```

Only whitelisted fields should be allowed.

The backend should never directly inject arbitrary query parameters into database sorting expressions.

---

# 50. Search

Search can initially support:

```text
GET /api/v1/leads?search=john
```

Search fields:

```text
name
email
phone
```

The exact database search strategy depends on the selected database engine.

---

# 51. API Validation

All incoming requests must be validated before reaching business logic.

```text
Request
  │
  ▼
Schema Validation
  │
  ├── Invalid → 422
  │
  └── Valid
       │
       ▼
    Controller
```

Validation should cover:

* Required fields
* Data types
* String lengths
* Email formats
* Enum values
* IDs
* File types
* File sizes

The exact validation library is a Phase 1 implementation decision.

---

# 52. Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What are you allowed to do?
```

Example:

```text
ADMIN
 ├── Create salesperson
 ├── Manage leads
 ├── Upload documents
 └── Manage company

SALESPERSON
 ├── View assigned leads
 ├── Update assigned leads
 └── Handle conversations
```

Every protected endpoint must enforce authorization where necessary.

---

# 53. Tenant Authorization

A user must never access another company's resource by changing an ID.

Incorrect:

```text
GET /api/v1/leads/company-b-lead-id
```

when the authenticated user belongs to Company A.

The backend must verify:

```text
authenticatedUser.companyId
        ==
resource.companyId
```

before returning the resource.

---

# 54. File Upload Security

Document upload APIs must validate:

```text
File type
File size
File extension
MIME type
Authentication
Company ownership
```

Initial MVP supports:

```text
PDF
```

Future support may include:

```text
DOCX
TXT
Web pages
URLs
JSON
CSV
```

---

# 55. Rate Limiting

Rate limiting should be applied especially to:

```text
Authentication endpoints
Chat endpoint
Document upload
Password reset
Public/future webhook endpoints
```

Example conceptual policy:

```text
/auth/*
     ↓
Strict rate limit

/chat
     ↓
AI-specific rate limit

/CRUD
     ↓
Standard API rate limit
```

Exact limits should be finalized after expected traffic is known.

---

# 56. Logging

API requests should produce structured logs.

Useful fields:

```json
{
  "requestId": "...",
  "userId": "...",
  "companyId": "...",
  "method": "POST",
  "path": "/api/v1/chat",
  "statusCode": 200,
  "latencyMs": 820
}
```

Sensitive values such as passwords, JWTs, API keys, and secrets must never be logged.

---

# 57. Request ID

Each request should have a unique request identifier.

```text
Request
  │
  ▼
requestId
  │
  ├── Controller logs
  ├── Service logs
  ├── RAG logs
  └── Error logs
```

This allows a complete request to be traced across services.

---

# 58. External Service Errors

External dependencies include:

```text
LLM
ChromaDB
Cloudinary
Embedding provider
Future WhatsApp API
```

These failures should be normalized into API errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable",
    "details": {}
  }
}
```

Internal infrastructure details should not be exposed to the client.

---

# 59. API Route Structure

Recommended Express structure:

```text
server/src/
│
├── routes/
│   ├── auth.routes.js
│   ├── company.routes.js
│   ├── user.routes.js
│   ├── salesperson.routes.js
│   ├── lead.routes.js
│   ├── document.routes.js
│   ├── conversation.routes.js
│   ├── chat.routes.js
│   └── dashboard.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── company.controller.js
│   ├── salesperson.controller.js
│   ├── lead.controller.js
│   ├── document.controller.js
│   ├── conversation.controller.js
│   ├── chat.controller.js
│   └── dashboard.controller.js
│
├── services/
│   ├── auth.service.js
│   ├── company.service.js
│   ├── salesperson.service.js
│   ├── lead.service.js
│   ├── document.service.js
│   ├── conversation.service.js
│   ├── chat.service.js
│   └── dashboard.service.js
│
└── validators/
    ├── auth.validator.js
    ├── lead.validator.js
    ├── document.validator.js
    └── chat.validator.js
```

---

# 60. API Request Lifecycle

All standard API requests should follow:

```text
Client
  │
  ▼
Express Router
  │
  ▼
Middleware
  │
  ├── Request ID
  ├── CORS
  ├── Rate Limit
  ├── Authentication
  ├── Authorization
  └── Validation
          │
          ▼
      Controller
          │
          ▼
       Service
          │
          ▼
     Repository
          │
          ▼
      Database
          │
          ▼
       Service
          │
          ▼
      Controller
          │
          ▼
     API Response
```

---

# 61. Chat Request Lifecycle

Chat has an extended flow:

```text
React
  │
  ▼
POST /api/v1/chat
  │
  ▼
Authentication
  │
  ▼
Conversation Validation
  │
  ▼
Store User Message
  │
  ▼
RAG Service
  │
  ▼
Retrieve Context
  │
  ▼
LLM
  │
  ▼
AI Response
  │
  ├───────────────┐
  │               │
  ▼               ▼
Store Message   AI Intent
                  │
                  ▼
             CRM Validation
                  │
                  ▼
              CRM Update
  │
  ▼
Return Response
```

---

# 62. Future WhatsApp API

WhatsApp is not part of the initial internal-chat MVP.

Future API:

```text
POST /api/v1/webhooks/whatsapp
```

Flow:

```text
WhatsApp
   │
   ▼
WhatsApp Business API
   │
   ▼
Webhook
   │
   ▼
Express
   │
   ▼
Conversation Service
   │
   ▼
RAG Agent
   │
   ▼
AI Response
   │
   ▼
WhatsApp API
```

The webhook should eventually handle:

* Incoming messages
* Message validation
* Customer identification
* Conversation creation
* AI response
* Outgoing messages
* Delivery status
* Error handling

This is a post-MVP API extension.

---

# 63. API Security Rules

The following rules are mandatory:

```text
✓ Never trust companyId from the frontend
✓ Resolve companyId from authenticated context
✓ Validate all input
✓ Authenticate protected endpoints
✓ Authorize resource access
✓ Rate-limit sensitive endpoints
✓ Validate uploaded files
✓ Never expose secrets
✓ Never expose database credentials
✓ Never expose LLM API keys
✓ Never allow arbitrary database operations through AI
✓ Never perform unrestricted cross-tenant retrieval
```

---

# 64. API Documentation Structure

The API documentation should eventually be represented in an OpenAPI-compatible specification.

Recommended structure:

```text
docs/
│
└── api.md
```

Future machine-readable specification:

```text
docs/
└── openapi.yaml
```

The OpenAPI specification should describe:

```text
Endpoints
Request schemas
Response schemas
Authentication
Errors
Parameters
Pagination
File uploads
```

---

# 65. Initial MVP API Surface

The initial implementation should prioritize:

```text
AUTH
├── POST /auth/register
├── POST /auth/login
├── POST /auth/logout
├── POST /auth/forgot-password
├── POST /auth/reset-password
└── GET  /auth/me

COMPANY
├── GET   /companies/me
└── PATCH /companies/me

SALESPERSON
├── GET   /salespersons
├── POST  /salespersons
├── GET   /salespersons/:id
├── PATCH /salespersons/:id
└── PATCH /salespersons/:id/status

LEADS
├── GET   /leads
├── POST  /leads
├── GET   /leads/:id
├── PATCH /leads/:id
├── PATCH /leads/:id/status
└── POST  /leads/:id/assign

DASHBOARD
└── GET /dashboard/overview

DOCUMENTS
├── POST   /documents
├── GET    /documents
├── GET    /documents/:id
├── GET    /documents/:id/status
└── DELETE /documents/:id

CONVERSATIONS
├── POST /conversations
├── GET  /conversations
└── GET  /conversations/:id

CHAT
└── POST /chat
```

---

# 66. API Development Sequence

The APIs should be implemented in this order:

```text
PHASE 1
Authentication
    ↓
Company Context
    ↓
Users / Roles
    ↓
Salespersons
    ↓
Leads
    ↓
Dashboard
    ↓
Documents
    ↓
RAG
    ↓
Conversations
    ↓
Chat
    ↓
AI → CRM
    ↓
Future WhatsApp
```

This follows the project's overall development strategy of establishing the backend and CRM foundation before integrating the complete AI/chat workflow.

---

# 67. API Definition of Done

The API architecture is considered ready for implementation when:

```text
✓ API versioning defined
✓ Authentication strategy defined
✓ Authorization strategy defined
✓ Tenant isolation defined
✓ Request/response format defined
✓ Error format defined
✓ HTTP status codes defined
✓ Validation strategy defined
✓ Pagination defined
✓ Filtering defined
✓ Authentication routes defined
✓ CRM routes defined
✓ Lead lifecycle routes defined
✓ Document routes defined
✓ Conversation routes defined
✓ Chat route defined
✓ RAG contract defined
✓ AI → CRM contract defined
✓ File upload strategy defined
✓ Rate limiting strategy defined
✓ Logging strategy defined
✓ Future WhatsApp webhook boundary defined
```

After approval:

```text
PHASE 0
Architecture + API Design
          │
          ▼
       API FREEZE
          │
          ▼
PHASE 1
Backend + Authentication
```

The API contract should be treated as the interface between the frontend and backend. Changes after Phase 1 begins should be versioned or documented as breaking/non-breaking API changes.
