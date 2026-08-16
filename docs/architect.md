# AI Sales CRM + RAG Agent — System Architecture

## 1. Purpose

This document defines the technical architecture of the AI Sales CRM + RAG Agent platform.

The platform combines:

1. CRM Dashboard
2. Company/Product Knowledge Base
3. RAG-based AI Agent
4. Internal Chat Interface
5. AI-powered CRM Intelligence
6. Future WhatsApp integration

The architecture follows one primary principle:

> **The Express backend is the central gateway between the frontend, CRM database, RAG system, storage, and external services.**

The frontend must never communicate directly with ChromaDB or the LLM.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │       React Client      │
                         │                         │
                         │  CRM Dashboard          │
                         │  Admin Panel            │
                         │  Chat Interface         │
                         └────────────┬────────────┘
                                      │
                              REST / Socket.IO
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │    Node.js / Express    │
                         │       API Server        │
                         │                         │
                         │ Auth                     │
                         │ CRM                      │
                         │ Chat                     │
                         │ Documents                │
                         │ AI / RAG Gateway         │
                         └───────┬─────────┬───────┘
                                 │         │
                    ┌────────────┘         └──────────────┐
                    ▼                                     ▼
          ┌──────────────────┐                 ┌──────────────────┐
          │ Primary Database │                 │    RAG Layer     │
          │                  │                 │                  │
          │ Users            │                 │ LangChain.js     │
          │ Companies        │                 │ Retrieval        │
          │ Salespersons     │                 │ Prompting        │
          │ Leads            │                 │ Generation       │
          │ Documents        │                 └────────┬─────────┘
          │ Conversations   │                          │
          │ Messages        │                          ▼
          └──────────────────┘                 ┌──────────────────┐
                                               │    ChromaDB      │
                                               │ Vector Storage   │
                                               └────────┬─────────┘
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │ Hugging Face     │
                                               │ Embeddings       │
                                               └────────┬─────────┘
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │       LLM        │
                                               │ Provider / Local │
                                               └──────────────────┘
```

---

# 3. Architecture Layers

The system is divided into the following logical layers:

```text
┌─────────────────────────────────────┐
│           Presentation Layer         │
│              React UI                │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│             API Layer                │
│        Node.js + Express             │
└──────────────────┬──────────────────┘
                   │
┌────────────┬─────┴──────┬───────────┐
│            │            │           │
▼            ▼            ▼           ▼
Auth        CRM          Chat       Documents
Service     Service      Service    Service
│            │            │           │
└────────────┴─────┬──────┴───────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
 Primary Database          RAG Layer
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
                 ChromaDB           LLM
```

---

# 4. Frontend Architecture

## Technology

* React
* Tailwind CSS v4
* Lucide Icons
* REST API
* Socket.IO client where required

The frontend is responsible for presentation and user interaction.

It must not contain business-critical backend logic.

## Frontend Responsibilities

```text
React
│
├── Authentication UI
│
├── Dashboard
│   ├── Statistics
│   ├── Lead overview
│   └── Recent activity
│
├── Lead Management
│
├── Salesperson Management
│
├── Company Management
│
├── Knowledge Base
│   ├── Upload documents
│   └── View document status
│
├── Chat
│   ├── Conversations
│   ├── Messages
│   └── AI responses
│
└── Notifications
```

The frontend communicates with the backend through:

```text
REST API
```

and optionally:

```text
Socket.IO
```

for real-time functionality.

---

# 5. Backend Architecture

## Technology

* Node.js
* Express.js
* REST APIs
* JWT authentication
* Socket.IO
* Cloudinary where required

The Express server acts as the main application gateway.

```text
Client
  │
  ▼
Express API
  │
  ├── Authentication
  ├── Authorization
  ├── CRM
  ├── Leads
  ├── Salespersons
  ├── Documents
  ├── Chat
  ├── RAG
  └── AI → CRM
```

## Backend Internal Structure

```text
server/
└── src/
    │
    ├── config/
    │
    ├── controllers/
    │
    ├── routes/
    │
    ├── middleware/
    │
    ├── models/
    │
    ├── services/
    │
    ├── repositories/
    │
    ├── validators/
    │
    ├── utils/
    │
    ├── rag/
    │
    └── app.js
```

---

# 6. Backend Request Flow

Every frontend request should follow this general pattern:

```text
Frontend
   │
   ▼
Route
   │
   ▼
Authentication Middleware
   │
   ▼
Authorization Middleware
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
Repository / External Service
   │
   ▼
Database / RAG / Storage
   │
   ▼
Service
   │
   ▼
Controller
   │
   ▼
Standardized Response
   │
   ▼
Frontend
```

Business logic should primarily live inside services rather than controllers.

---

# 7. Primary Database Architecture

The primary application database stores business and application data.

It should contain entities such as:

```text
Users
Companies
Salespersons
Leads
Lead Assignments
Documents
Conversations
Messages
Authentication / Session Metadata
```

Conceptually:

```text
Company
   │
   ├── Users
   │
   ├── Salespersons
   │
   ├── Leads
   │
   ├── Documents
   │
   └── Conversations
```

The primary database is the source of truth for CRM data.

---

# 8. Vector Database Architecture

ChromaDB is used exclusively for RAG vector storage.

It should not become the primary CRM database.

```text
Document
   │
   ▼
Extracted Text
   │
   ▼
Chunks
   │
   ▼
Embeddings
   │
   ▼
ChromaDB
```

Each vector should contain appropriate metadata.

Example:

```json
{
  "document_id": "...",
  "company_id": "...",
  "document_type": "product",
  "page_number": 4,
  "chunk_id": "...",
  "source": "product-guide.pdf"
}
```

The `company_id` is particularly important for multi-tenant isolation.

---

# 9. RAG Architecture

The RAG system consists of two major pipelines:

1. Ingestion pipeline
2. Query pipeline

---

## 9.1 RAG Ingestion Pipeline

```text
PDF Upload
     │
     ▼
Original File Storage
     │
     ▼
Document Metadata Created
     │
     ▼
Text Extraction
     │
     ▼
Text Cleaning
     │
     ▼
Chunking
     │
     ▼
Embedding Generation
     │
     ▼
ChromaDB
     │
     ▼
Document Status = INDEXED
```

Document processing states:

```text
UPLOADED
    │
    ▼
PROCESSING
    │
    ▼
TEXT_EXTRACTED
    │
    ▼
CHUNKING
    │
    ▼
EMBEDDING
    │
    ▼
INDEXED
```

Failure:

```text
PROCESSING
    │
    ▼
FAILED
```

---

# 10. RAG Query Pipeline

When a user asks a question:

```text
User Question
      │
      ▼
Express / Chat API
      │
      ▼
Authentication
      │
      ▼
Identify Company
      │
      ▼
RAG Agent
      │
      ▼
Question Embedding
      │
      ▼
ChromaDB Similarity Search
      │
      ▼
Company/Tenant Filter
      │
      ▼
Top Relevant Chunks
      │
      ▼
Context Builder
      │
      ▼
Prompt Template
      │
      ▼
LLM
      │
      ▼
Grounded Response
      │
      ▼
Express API
      │
      ▼
Chat UI
```

---

# 11. RAG Component Architecture

```text
rag/
│
├── loaders/
│   └── pdf-loader
│
├── processors/
│   └── text-cleaner
│
├── chunkers/
│   └── text-chunker
│
├── embeddings/
│   └── huggingface
│
├── vectorstore/
│   └── chromadb
│
├── retrievers/
│   └── similarity-retriever
│
├── prompts/
│   ├── system-prompt
│   └── answer-prompt
│
├── chains/
│   └── rag-chain
│
└── agent/
    └── sales-agent
```

---

# 12. LangChain.js Responsibility

LangChain.js is responsible for orchestrating the RAG workflow.

Conceptually:

```text
Question
   │
   ▼
Retriever
   │
   ▼
Relevant Documents
   │
   ▼
Prompt
   │
   ▼
LLM
   │
   ▼
Answer
```

LangChain should not become responsible for CRM database mutations.

CRM operations remain controlled by backend services.

---

# 13. LLM Architecture

The exact LLM provider is a Phase 0 decision.

The architecture should keep the LLM provider replaceable.

```text
                  RAG Agent
                     │
                     ▼
               LLM Adapter
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Cloud LLM              Local LLM
```

The rest of the application should communicate with an internal abstraction rather than directly depending on a specific provider.

Example conceptual interface:

```text
generateResponse({
    messages,
    context,
    metadata
})
```

This allows the provider to be changed later without redesigning the entire application.

---

# 14. Authentication Architecture

Authentication is handled by the backend.

```text
User
 │
 ▼
Register / Login
 │
 ▼
Validation
 │
 ▼
Password Verification
 │
 ▼
JWT Generation
 │
 ▼
Authenticated Request
 │
 ▼
JWT Middleware
 │
 ▼
User Identity
 │
 ▼
Authorization
```

Protected request:

```text
Request
  │
  ▼
JWT
  │
  ▼
Authentication Middleware
  │
  ▼
User
  │
  ▼
Company/Tenant
  │
  ▼
Role Check
  │
  ▼
Controller
```

---

# 15. Multi-Tenant Architecture

The platform should be designed as company-aware from the beginning.

```text
                    Platform
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
      Company A                 Company B
          │                         │
     ┌────┼────┐               ┌────┼────┐
     ▼    ▼    ▼               ▼    ▼    ▼
   Users Leads Docs          Users Leads Docs
```

Every tenant-sensitive request should resolve:

```text
Authenticated User
        │
        ▼
     companyId
        │
        ▼
Business Operation
```

For RAG:

```text
Question
   │
   ▼
companyId
   │
   ▼
Vector Search Filter
   │
   ▼
Company-specific chunks
```

Company A must never retrieve Company B's vectors.

Tenant isolation must therefore be enforced at the backend and retrieval layers, not only in the frontend.

---

# 16. CRM Architecture

The CRM is responsible for business entities.

```text
CRM
│
├── Company
│
├── Salesperson
│
├── Lead
│
├── Lead Assignment
│
├── Activity
│
└── Conversation
```

Lead lifecycle:

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

Alternative outcomes:

```text
NOT_INTERESTED
LOST
```

---

# 17. AI → CRM Architecture

The AI must not directly modify CRM data.

Incorrect:

```text
LLM
 │
 └──────► Database ❌
```

Correct:

```text
Customer Message
       │
       ▼
      RAG
       │
       ▼
      LLM
       │
       ▼
Structured Intent
       │
       ▼
Backend Validation
       │
       ▼
CRM Service
       │
       ▼
Database
```

Example AI output:

```json
{
  "intent": "PURCHASE",
  "interest": "HIGH",
  "callback_required": true,
  "product": "Product X"
}
```

The backend validates this output before performing any CRM operation.

---

# 18. Chat Architecture

The initial MVP uses an internal web chat.

```text
React Chat
    │
    ▼
POST /api/chat
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
ChromaDB
    │
    ▼
LLM
    │
    ▼
AI Response
    │
    ▼
Conversation Service
    │
    ▼
Database
    │
    ▼
React Chat
```

A chat response should conceptually contain:

```json
{
  "answer": "...",
  "conversationId": "...",
  "sources": [],
  "confidence": {},
  "metadata": {}
}
```

---

# 19. Real-Time Architecture

Socket.IO should only be introduced where real-time communication provides value.

Potential use cases:

```text
Socket.IO
│
├── Message status
├── Agent processing state
├── Streaming-like UI updates
├── Live CRM updates
└── Notifications
```

The first MVP request/response chat can operate using REST.

```text
REST
────
User → API → RAG → Response
```

Socket.IO can be introduced afterward:

```text
WebSocket
─────────
User ↔ Server
```

---

# 20. Document Storage Architecture

Original uploaded files should be stored separately from vector data.

```text
User
 │
 ▼
Express
 │
 ▼
File Validation
 │
 ▼
File Storage
 │
 ├── Original PDF
 │
 └── File URL
       │
       ▼
Document Metadata
       │
       ▼
RAG Ingestion
```

Cloudinary can be used where appropriate for file/image storage.

The vector database should contain the processed chunks and embeddings rather than the original file.

---

# 21. API Architecture

The API should be versionable.

Recommended structure:

```text
/api/v1
```

Example:

```text
/api/v1/auth
/api/v1/users
/api/v1/companies
/api/v1/salespersons
/api/v1/leads
/api/v1/documents
/api/v1/conversations
/api/v1/chat
```

General response format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error format:

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

---

# 22. Security Architecture

Security must be implemented across the backend.

```text
Request
 │
 ▼
CORS
 │
 ▼
Rate Limiting
 │
 ▼
Authentication
 │
 ▼
Authorization
 │
 ▼
Input Validation
 │
 ▼
Business Logic
 │
 ▼
Database / External Service
```

Security responsibilities include:

* JWT security
* Password hashing
* Input validation
* Rate limiting
* File validation
* File size restrictions
* CORS restrictions
* Secure environment variables
* API authorization
* Tenant isolation
* Webhook verification when external channels are introduced

---

# 23. WhatsApp Architecture — Future

WhatsApp is intentionally outside the initial internal-chat architecture.

Future flow:

```text
Customer
   │
   ▼
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
LLM
   │
   ▼
AI Response
   │
   ▼
WhatsApp API
   │
   ▼
Customer
```

The same conversation should be linkable to:

```text
Customer
   ↓
Conversation
   ↓
Lead
   ↓
Salesperson
```

WhatsApp should therefore be treated as a communication-channel extension rather than the foundation of the product.

---

# 24. Complete Data Flow

## Company Knowledge Flow

```text
Admin
 │
 ▼
Upload PDF
 │
 ▼
Express
 │
 ├── Store File
 │
 └── Create Document Metadata
          │
          ▼
     RAG Ingestion
          │
          ▼
      Extract Text
          │
          ▼
        Chunk
          │
          ▼
      Embeddings
          │
          ▼
       ChromaDB
```

## Customer Question Flow

```text
Customer
 │
 ▼
Chat
 │
 ▼
Express
 │
 ▼
Authentication
 │
 ▼
Identify Company
 │
 ▼
RAG Agent
 │
 ▼
Question Embedding
 │
 ▼
ChromaDB
 │
 ▼
Relevant Context
 │
 ▼
LLM
 │
 ▼
AI Response
 │
 ├───────────────► Customer
 │
 └───────────────► CRM Intelligence
                           │
                           ▼
                         Lead
                           │
                           ▼
                    Salesperson
```

---

# 25. Complete System Architecture

```text
                              ┌─────────────────┐
                              │  COMPANY ADMIN  │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   React CRM     │
                              │    Dashboard    │
                              └────────┬────────┘
                                       │
                                 REST / WS
                                       │
                                       ▼
                    ┌────────────────────────────────┐
                    │       NODE.JS / EXPRESS        │
                    │                                │
                    │  Auth │ CRM │ Chat │ RAG API  │
                    └───────┬───────────────┬────────┘
                            │               │
              ┌─────────────┘               └──────────────┐
              ▼                                            ▼
     ┌─────────────────┐                          ┌─────────────────┐
     │ Primary Database│                          │   RAG Engine    │
     │                 │                          │   LangChain.js  │
     │ Users           │                          └────────┬────────┘
     │ Companies       │                                   │
     │ Salespersons    │                                   ▼
     │ Leads           │                          ┌─────────────────┐
     │ Documents       │                          │    ChromaDB     │
     │ Conversations   │                          │                 │
     │ Messages        │                          │ Company vectors │
     └─────────────────┘                          └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │   Embeddings    │
                                                  │ Hugging Face    │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │      LLM        │
                                                  │ Cloud / Local   │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Structured AI   │
                                                  │ Intent Output   │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Backend         │
                                                  │ Validation      │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ CRM Service     │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Lead / CRM DB   │
                                                  └─────────────────┘
```

---

# 26. Architectural Principles

## Principle 1 — Separate CRM and Vector Data

The primary database stores business entities.

ChromaDB stores embeddings and retrieval data.

```text
Primary DB ≠ ChromaDB
```

---

## Principle 2 — Backend Is the Gateway

```text
React
  ↓
Express
  ↓
Services
```

The frontend must not directly communicate with internal AI infrastructure.

---

## Principle 3 — RAG Is Company-Aware

Every document and vector must belong to a company/tenant.

```text
companyId
```

must be part of the retrieval strategy.

---

## Principle 4 — AI Does Not Directly Control the Database

```text
AI
 ↓
Structured Output
 ↓
Backend Validation
 ↓
CRM Service
 ↓
Database
```

---

## Principle 5 — Internal Chat Before WhatsApp

The complete AI workflow should first be validated through the internal chat interface.

WhatsApp comes afterward.

---

## Principle 6 — RAG Quality Must Be Measured

A chatbot producing an answer does not automatically mean the RAG system is correct.

The system should eventually measure:

* Retrieval accuracy
* Relevant chunk selection
* Answer correctness
* Hallucination rate
* Response latency

---

# 27. Phase 0 Architecture Deliverables

At the end of Phase 0, the following architecture artifacts should exist:

```text
docs/
│
├── architecture.md          ← This document
├── database.md
├── api.md
├── authentication.md
├── rag.md
├── ingestion.md
├── crm.md
├── chat.md
├── ai-crm-integration.md
├── environment.md
└── development-standards.md
```

The architecture should be reviewed and frozen before Phase 1 begins.

---

# 28. Architecture Freeze

Phase 0 is complete when the following are finalized:

```text
✓ Frontend architecture
✓ Backend architecture
✓ Primary database architecture
✓ RAG architecture
✓ ChromaDB architecture
✓ Authentication strategy
✓ Role strategy
✓ Tenant isolation strategy
✓ Lead lifecycle
✓ Document ingestion flow
✓ Chat architecture
✓ AI response structure
✓ AI → CRM contract
✓ LLM decision
✓ RAG deployment decision
✓ API conventions
✓ Folder structure
✓ Environment variables
✓ Development standards
```

After this point:

```text
PHASE 0
Architecture & Planning
        │
        │  FREEZE
        ▼
PHASE 1
Backend + Authentication
```

The purpose of the freeze is to ensure that implementation begins from a known architecture rather than continuously changing the system design during development.
