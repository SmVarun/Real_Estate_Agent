# AI Sales CRM

> An AI-powered, multi-tenant Sales CRM designed to centralize customer data, automate sales workflows, provide intelligent conversations, and enable context-aware AI assistance through RAG.

---

## 📌 Overview

**AI Sales CRM** is a production-oriented CRM platform built around a modular architecture.

The system combines:

* Customer & company management
* Lead and sales pipeline management
* AI-powered sales assistance
* Context-aware conversations
* RAG-based knowledge retrieval
* Real-time communication
* Multi-tenant data isolation
* Authentication and authorization
* Document ingestion and processing
* Sales analytics and activity tracking

The project is being developed incrementally, starting with a stable **MVP** and evolving toward a complete AI-native CRM platform.

---

# 🎯 Project Goals

The primary goals are:

1. Build a reliable CRM foundation.
2. Support multiple companies/tenants.
3. Keep customer data isolated between tenants.
4. Introduce AI without coupling the entire application to an LLM.
5. Build an independent RAG pipeline.
6. Support real-time CRM interactions.
7. Maintain clean service boundaries.
8. Make the system scalable and production-ready.
9. Keep the codebase easy for multiple developers to contribute to.

---

# 🏗️ Architecture

The MVP follows a modular monorepo architecture.

```text
                         ┌──────────────────────┐
                         │      React Web       │
                         │  Tailwind + Lucide   │
                         └──────────┬───────────┘
                                    │
                                    │ REST / WebSocket
                                    ▼
                         ┌──────────────────────┐
                         │    Node / Express    │
                         │      API Server      │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
       │ CRM Services │      │ Auth / RBAC  │      │ Socket.IO    │
       │ Leads/Deals  │      │ JWT / Tenant │      │ Real-time    │
       └──────┬───────┘      └──────────────┘      └──────────────┘
              │
              ▼
       ┌──────────────┐
       │ Primary DB   │
       │ CRM Data     │
       └──────────────┘

                                    │
                                    │ AI / RAG
                                    ▼

                         ┌──────────────────────┐
                         │      RAG Service     │
                         │     LangChain.js     │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  ▼                 ▼                 ▼
            ┌──────────┐      ┌────────────┐   ┌──────────────┐
            │ Ingestion│      │ Embeddings │   │   Retriever  │
            └──────────┘      └────────────┘   └──────┬───────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │  ChromaDB    │
                                               │ Vector Store │
                                               └──────────────┘
```

---

# 🧰 Tech Stack

## Frontend

| Technology      | Purpose      |
| --------------- | ------------ |
| React           | UI framework |
| Tailwind CSS v4 | Styling      |
| Lucide          | UI icons     |

## Backend

| Technology | Purpose                 |
| ---------- | ----------------------- |
| Node.js    | Runtime                 |
| Express.js | REST API                |
| JWT        | Authentication          |
| Socket.IO  | Real-time communication |
| Cloudinary | File/media storage      |

## AI / RAG

| Technology   | Purpose                |
| ------------ | ---------------------- |
| LangChain.js | RAG orchestration      |
| Hugging Face | Embeddings / AI models |
| ChromaDB     | Vector database        |

## Data

The application uses:

```text
Primary Database
      │
      ├── Companies
      ├── Users
      ├── Leads
      ├── Contacts
      ├── Deals
      ├── Activities
      └── CRM entities

ChromaDB
      │
      └── Embeddings / Vectorized knowledge
```

**Important:** ChromaDB is used for vector data and retrieval. It is not the primary CRM database.

---

# 📁 Repository Structure

```text
ai-sales-crm/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   │
│   ├── server/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── sockets/
│   │   │   ├── utils/
│   │   │   └── app.js
│   │   └── package.json
│   │
│   └── rag/
│       ├── src/
│       │   ├── ingestion/
│       │   ├── embeddings/
│       │   ├── retrieval/
│       │   ├── chains/
│       │   └── services/
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── constants/
│       ├── schemas/
│       ├── types/
│       └── utils/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── authentication.md
│   ├── rag.md
│   ├── ingestion.md
│   └── chat.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# 🔐 Authentication & Authorization

The authentication layer uses JWT-based authentication.

The system is designed around:

```text
User
  │
  ▼
Authentication
  │
  ▼
JWT
  │
  ▼
Authorization
  │
  ▼
Tenant / Company
  │
  ▼
CRM Resources
```

Every protected request must establish:

* User identity
* User permissions
* Company/tenant context

---

# 🏢 Multi-Tenancy

The CRM is designed as a multi-tenant application.

Every tenant-owned resource should be associated with:

```text
companyId
```

Example:

```text
Company A
 ├── Users
 ├── Leads
 ├── Contacts
 └── Deals

Company B
 ├── Users
 ├── Leads
 ├── Contacts
 └── Deals
```

A user belonging to **Company A must never be able to access Company B's CRM data**.

Tenant isolation must therefore be enforced at the backend/service layer rather than relying only on frontend filtering.

---

# 🤖 RAG Architecture

The RAG system provides the AI layer with relevant company and CRM context.

```text
Document
   │
   ▼
Ingestion
   │
   ▼
Text Extraction
   │
   ▼
Chunking
   │
   ▼
Embeddings
   │
   ▼
ChromaDB
   │
   ▼
Retriever
   │
   ▼
Relevant Context
   │
   ▼
LLM
   │
   ▼
AI Response
```

The RAG layer should remain modular so that models, embedding providers, and retrieval strategies can evolve independently from the CRM API.

---

# 💬 Chat Architecture

Real-time communication is handled using Socket.IO.

```text
React Client
     │
     │ WebSocket
     ▼
Socket.IO Server
     │
     ├── Authentication
     ├── Tenant validation
     ├── Room management
     └── Message events
             │
             ▼
        Chat Service
             │
             ▼
        Primary DB
```

The chat layer can later be connected to the AI/RAG system for context-aware sales conversations.

---

# 🌐 API

The backend API is versioned.

Base path:

```text
/api/v1
```

Initial health endpoint:

```http
GET /api/v1/health
```

Example response:

```json
{
  "status": "ok",
  "service": "ai-sales-crm"
}
```

Future API modules include:

```text
/api/v1/auth
/api/v1/users
/api/v1/companies
/api/v1/leads
/api/v1/contacts
/api/v1/deals
/api/v1/activities
/api/v1/chat
/api/v1/ai
/api/v1/knowledge
```

---

# ⚙️ Environment Variables

Create a local environment file from the example:

```bash
cp .env.example .env
```

Environment configuration should contain values for:

```text
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

HUGGINGFACE_API_KEY

CHROMA_URL
```

Never commit `.env` files containing secrets.

---

# 🚀 Local Development

## 1. Clone the repository

```bash
git clone <repository-url>
cd ai-sales-crm
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Add the required credentials.

## 4. Start development

Run the required applications according to the workspace scripts.

Example:

```bash
npm run dev
```

---

# 🩺 Health & Verification

Phase 0 must establish a working development environment before feature development begins.

Minimum verification:

```text
✓ Frontend starts
✓ Backend starts
✓ Database connects
✓ Health endpoint works
✓ Environment variables load
✓ Authentication middleware loads
✓ Tenant context is available
✓ RAG service initializes
✓ ChromaDB connection works
✓ Frontend can communicate with backend
```

---

# 🛡️ Error Handling & Logging

The backend should use centralized error handling.

```text
Request
   │
   ▼
Route
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Error
   │
   ▼
Central Error Middleware
   │
   ▼
Standard API Response
```

Errors should not expose:

* Secrets
* Database credentials
* Internal stack traces in production
* Sensitive tenant information

---

# 🧪 Testing Strategy

Testing will be introduced incrementally.

```text
Unit Tests
    │
    ├── Services
    ├── Utilities
    └── Validation

Integration Tests
    │
    ├── API
    ├── Database
    └── Authentication

E2E Tests
    │
    └── Critical user flows
```

Critical flows should eventually include:

* Registration
* Login
* Authorization
* Tenant isolation
* Lead creation
* Deal management
* Chat
* Document ingestion
* RAG retrieval

---

# 🌳 Git & Team Development Workflow

Since multiple developers are working on the same repository, **do not develop directly on `main`**.

Recommended workflow:

```text
main
 │
 ├── feature/authentication
 │
 ├── feature/crm-leads
 │
 ├── feature/chat
 │
 └── fix/payment-error
```

Create a branch:

```bash
git switch main
git pull origin main

git switch -c feature/my-feature
```

Make changes:

```bash
git add .
git commit -m "feat: add my feature"
```

Push:

```bash
git push -u origin feature/my-feature
```

Then create a Pull Request:

```text
feature/my-feature
        │
        ▼
      Review
        │
        ▼
      main
```

### Commit Convention

Use conventional commit prefixes:

```text
feat:     New feature
fix:      Bug fix
refactor: Code restructuring
docs:     Documentation
test:     Tests
chore:    Maintenance
perf:     Performance improvement
```

Examples:

```bash
git commit -m "feat: add lead management"
git commit -m "fix: resolve JWT validation"
git commit -m "docs: update RAG architecture"
git commit -m "refactor: simplify chat service"
```

---

# 🔄 Keeping Your Branch Updated

Before starting new work:

```bash
git switch main
git pull origin main
git switch -c feature/new-feature
```

If `main` changes while you are working:

```bash
git fetch origin
git merge origin/main
```

Follow the team's agreed merge/rebase policy when updating an existing feature branch.

---

# 📚 Documentation

Project documentation is maintained inside `/docs`.

| Document            | Purpose                        |
| ------------------- | ------------------------------ |
| `architecture.md`   | System architecture            |
| `database.md`       | Database design                |
| `api.md`            | API specification              |
| `authentication.md` | Authentication & authorization |
| `rag.md`            | RAG architecture               |
| `ingestion.md`      | Document ingestion pipeline    |
| `chat.md`           | Chat architecture              |

Documentation should be updated alongside major architectural changes.

---

# 🗺️ Development Phases

## Phase 0 — Foundation

* [ ] Create monorepo
* [ ] Configure frontend
* [ ] Configure backend
* [ ] Configure RAG application
* [ ] Configure shared package
* [ ] Configure environment variables
* [ ] Configure database
* [ ] Configure ChromaDB
* [ ] Add health endpoint
* [ ] Add centralized error handling
* [ ] Add logging
* [ ] Establish tenant context
* [ ] Verify frontend/backend communication

## Phase 1 — Authentication

* [ ] Registration
* [ ] Login
* [ ] JWT authentication
* [ ] Logout
* [ ] Protected routes
* [ ] RBAC
* [ ] Company/tenant creation
* [ ] Tenant isolation

## Phase 2 — CRM Core

* [ ] Companies
* [ ] Users
* [ ] Leads
* [ ] Contacts
* [ ] Deals
* [ ] Activities
* [ ] Sales pipeline

## Phase 3 — Knowledge & RAG

* [ ] Document upload
* [ ] Document ingestion
* [ ] Text extraction
* [ ] Chunking
* [ ] Embedding generation
* [ ] ChromaDB storage
* [ ] Retrieval
* [ ] Context-aware responses

## Phase 4 — AI & Chat

* [ ] Real-time chat
* [ ] AI assistant
* [ ] CRM-aware conversations
* [ ] RAG-powered responses
* [ ] Conversation history
* [ ] AI sales assistance

## Phase 5 — Production Hardening

* [ ] Automated tests
* [ ] Security review
* [ ] Performance optimization
* [ ] Observability
* [ ] CI/CD
* [ ] Production deployment
* [ ] Backup strategy

---

# 📏 Engineering Principles

The project follows these principles:

### 1. Separation of Concerns

Business logic should live in services rather than controllers.

### 2. API Versioning

All public APIs should use versioned routes.

### 3. Tenant Isolation

Every tenant-owned resource must enforce `companyId` isolation.

### 4. Secure by Default

Secrets must remain outside source control.

### 5. Modular AI

The AI/RAG layer should not tightly couple itself to the CRM core.

### 6. Review Before Merge

Changes should go through Pull Requests.

### 7. Documentation Alongside Code

Architectural changes should be reflected in `/docs`.

---

# 🚧 MVP Scope

The MVP focuses on establishing a strong CRM and AI foundation.

### Included

* Authentication
* Multi-tenancy
* CRM core
* Leads
* Contacts
* Deals
* Activities
* Real-time chat foundation
* Document ingestion
* RAG
* AI assistance
* Cloudinary media handling

### Not Part of the Initial MVP

The system should avoid prematurely introducing additional integrations and complexity before the core CRM, AI, RAG, authentication, and multi-tenant architecture are stable.

---

# 📌 Definition of Done

A feature is considered complete when:

```text
✓ Code implemented
✓ Validation added
✓ Error handling added
✓ Tenant isolation verified
✓ Tests added where applicable
✓ Documentation updated
✓ Code reviewed
✓ PR approved
✓ CI checks pass
✓ Merged into main
```

---

# 👥 Contribution

1. Create an issue or select an assigned task.
2. Pull the latest `main`.
3. Create a feature/fix branch.
4. Implement the change.
5. Test locally.
6. Commit using conventional commits.
7. Push the branch.
8. Open a Pull Request.
9. Address review comments.
10. Merge only after approval.

---

# 📄 License

License information will be added before the first public production release.

---

## Project Status

**Current Stage:** MVP Development — Phase 0 / Foundation

The architecture and documentation are being developed first so that feature development can proceed consistently across the team.
