🔄 End-to-End RAG Data Flow
                COMPANY / ADMIN
                      │
                      │ Upload PDF
                      ▼
             ┌──────────────────┐
             │ Document Upload  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Text Extraction  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Text Cleaning    │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │     Chunking     │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Hugging Face     │
             │   Embeddings     │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │    ChromaDB      │
             │ Vector Storage   │
             └────────┬─────────┘
                      │
                      │ Retrieval
                      ▼
USER ─────────► QUESTION
                      │
                      ▼
             ┌──────────────────┐
             │ Query Embedding  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Similarity Search│
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Relevant Chunks  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │      LLM         │
             │ Context + Prompt │
             └────────┬─────────┘
                      │
                      ▼
                AI RESPONSE
🛠️ Technology Stack
🖥️ Frontend
Technology	Purpose
⚛️ React	UI framework
🎨 Tailwind CSS v4	Styling and responsive UI
✨ Lucide Icons	Interface icons
🌐 REST API	Backend communication
🔌 Socket.IO Client	Future real-time features
Technology icons
⚛️ React
🎨 Tailwind CSS
✨ Lucide
⚙️ Backend
Technology	Purpose
🟢 Node.js	JavaScript runtime
🚂 Express.js	REST API framework
☁️ Cloudinary	Image/file asset storage where required
🔌 Socket.IO	Real-time communication
🔐 JWT	Authentication
🔒 bcrypt	Password hashing

The design explicitly specifies Node.js, Express, Cloudinary for image storage and Socket.IO for real-time messaging. fileciteturn0file0L904-L910

Technology icons
🟢 Node.js
🚂 Express.js
☁️ Cloudinary
🔌 Socket.IO
🔐 JWT
🧠 RAG / AI
Technology	Purpose
🟨 JavaScript	RAG implementation language
🦜 LangChain.js	RAG orchestration
🗄️ ChromaDB	Vector database
🤗 Hugging Face Embeddings	Text embeddings
🧠 LLM	Final response generation

The source architecture explicitly calls for JavaScript + LangChain, ChromaDB and Hugging Face embeddings. fileciteturn0file0L269-L275

Technology icons
🟨 JavaScript
🦜 LangChain
🗄️ ChromaDB
🤗 Hugging Face
🧠 LLM
🗂️ Recommended MVP Repository Structure
ai-sales-crm/
│   │   │   │   ├── document.routes.js
│   │   │   │   └── chat.routes.js
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── User.js
│   │   │   │   ├── Lead.js
│   │   │   │   ├── Salesperson.js
│   │   │   │   ├── Document.js
│   │   │   │   ├── Conversation.js
│   │   │   │   └── Message.js
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── lead.service.js
│   │   │   │   ├── salesperson.service.js
│   │   │   │   ├── document.service.js
│   │   │   │   └── rag.service.js
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js
│   │   │   │   ├── error.middleware.js
│   │   │   │   ├── upload.middleware.js
│   │   │   │   └── validation.middleware.js
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── auth.validator.js
│   │   │   │   ├── lead.validator.js
│   │   │   │   ├── salesperson.validator.js
│   │   │   │   └── document.validator.js
│   │   │   │
│   │   │   ├── sockets/
│   │   │   │   └── chat.socket.js
│   │   │   │
│   │   │   ├── utils/
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   │
│   │   └── package.json
│   │
│   └── rag/
│       ├── src/
│       │   │
│       │   ├── config/
│       │   │   ├── chroma.js
│       │   │   ├── embeddings.js
│       │   │   └── llm.js
│       │   │
│       │   ├── ingestion/
│       │   │   ├── loader.js
│       │   │   ├── splitter.js
│       │   │   ├── cleaner.js
│       │   │   └── embedder.js
│       │   │
│       │   ├── retrieval/
│       │   │   ├── retriever.js
│       │   │   └── filters.js
│       │   │
│       │   ├── chains/
│       │   │   ├── rag.chain.js
│       │   │   └── prompt.js
│       │   │
│       │   ├── agents/
│       │   │   └── sales.agent.js
│       │   │
│       │   ├── utils/
│       │   └── index.js
│       │
│       ├── package.json
│       └── README.md
│
├── packages/
│   ├── shared/
│   │   ├── constants/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── config/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── rag.md
│   ├── deployment.md
│   └── development.md
│
├── scripts/
│   ├── seed.js
│   └── test-rag.js
│
└── tests/
    ├── api/
    ├── rag/
    └── integration/
🧩 Application Responsibilities
apps/web

Responsible only for presentation and client-side behavior.

React
 ├── Authentication UI
 ├── Dashboard
 ├── Lead Management
 ├── Salesperson Management
 ├── Knowledge Base
 └── Chat

The frontend should never directly access:

ChromaDB
LLM provider
Internal vector collections
Database credentials
⚙️ apps/server

The Express server is the main application gateway.

Frontend
   │
   ▼
Express Server
   │
   ├── Auth
   ├── CRM
   ├── Documents
   ├── Chat
   └── RAG Gateway

The design specifically states that the backend/server acts as the linkage between the frontend/platform and the RAG agent and uses REST for this integration. fileciteturn0file0L518-L526

🧠 apps/rag

The RAG application owns AI-specific operations.

rag/
│
├── ingestion/
│     ├── Load document
│     ├── Extract text
│     ├── Clean text
│     ├── Split chunks
│     └── Generate embeddings
│
├── retrieval/
│     ├── Create query embedding
│     ├── Search ChromaDB
│     └── Apply metadata filters
│
├── chains/
│     ├── Prompt
│     └── RAG chain
│
└── agents/
      └── Sales agent
🗃️ CRM Data Model
User
User
├── id
├── name
├── email
├── passwordHash
├── role
├── twoFactorEnabled
├── createdAt
└── updatedAt
Salesperson
Salesperson
├── id
├── name
├── email
├── phone
├── status
├── assignedLeads
├── companyId
├── createdAt
└── updatedAt
Lead
Lead
├── id
├── name
├── email
├── phone
├── source
├── interestLevel
├── status
├── salespersonId
├── notes
├── lastInteraction
├── companyId
├── createdAt
└── updatedAt
Document
Document
├── id
├── companyId
├── name
├── type
├── source
├── storageUrl
├── status
├── chunkCount
├── uploadedBy
├── createdAt
└── updatedAt
Conversation
Conversation
├── id
├── userId / customerId
├── leadId
├── companyId
├── channel
├── status
├── createdAt
└── updatedAt
Message
Message
├── id
├── conversationId
├── role
├── content
├── sources
├── metadata
└── createdAt
🔐 Authentication Flow
             REGISTER
                 │
                 ▼
          Validate Input
                 │
                 ▼
          Hash Password
                 │
                 ▼
           Create User
                 │
                 ▼
          Account Created




              LOGIN
                 │
                 ▼
        Validate Credentials
                 │
                 ▼
        ┌────────────────┐
        │ 2FA Enabled ?  │
        └───────┬────────┘
                │
         ┌──────┴──────┐
        YES            NO
         │              │
         ▼              │
    Verify OTP          │
         │              │
         └──────┬───────┘
                ▼
           Issue JWT
                │
                ▼
       Access Protected APIs

MVP authentication is JWT-based and includes login, registration, forgot password and two-factor authentication as specified in the design. fileciteturn0file0L585-L591

👥 Lead Management Flow
                 CUSTOMER
                    │
                    ▼
                AI CHAT
                    │
                    ▼
              Conversation
                    │
                    ▼
           Interest Detection
                    │
          ┌─────────┴─────────┐
          │                   │
       LOW/MED              HIGH
          │                   │
          ▼                   ▼
       Continue          Create/Update
       Conversation           Lead
                              │
                              ▼
                       Assign Salesperson
                              │
                              ▼
                         CRM Dashboard

For the initial MVP, lead creation/assignment can be controlled through CRM APIs and UI. AI-driven lead scoring can be added after the basic workflow is stable.

📚 Knowledge Base Flow
ADMIN
  │
  │ Upload PDF
  ▼
Backend
  │
  ├── Validate file
  ├── Store file
  └── Create document record
          │
          ▼
      RAG Ingestion
          │
          ▼
     Extract Text
          │
          ▼
      Clean Text
          │
          ▼
       Chunk Text
          │
          ▼
   Hugging Face Embedding
          │
          ▼
       ChromaDB
          │
          ▼
      READY TO QUERY
💬 Chat Request Flow
USER
 │
 │ "What are the features of Product X?"
 ▼
React Chat
 │
 │ POST /api/chat
 ▼
Express
 │
 ├── Authenticate
 ├── Identify company
 ├── Identify conversation
 │
 ▼
RAG Service
 │
 ▼
Create Query Embedding
 │
 ▼
ChromaDB Similarity Search
 │
 ▼
Top Relevant Chunks
 │
 ▼
Prompt Construction
 │
 ▼
LLM
 │
 ▼
Grounded Answer
 │
 ▼
Express
 │
 ▼
React Chat
🌐 MVP API Structure
Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-2fa
Users
GET    /api/users/me
PATCH  /api/users/me
Salespersons
GET    /api/salespersons
POST   /api/salespersons
GET    /api/salespersons/:id
PATCH  /api/salespersons/:id
DELETE /api/salespersons/:id
Leads
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PATCH  /api/leads/:id
DELETE /api/leads/:id
PATCH  /api/leads/:id/assign
PATCH  /api/leads/:id/status
Documents
GET    /api/documents
POST   /api/documents/upload
GET    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/:id/reprocess
Chat
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id
GET    /api/conversations/:id/messages
POST   /api/chat
🧠 RAG API Contract
Request
{
  "conversationId": "conversation-id",
  "message": "What are the features of Product X?"
}
Internal RAG Request
{
  "query": "What are the features of Product X?",
  "companyId": "company-id",
  "conversationId": "conversation-id"
}
Response
{
  "answer": "Product X provides ...",
  "sources": [
    {
      "documentId": "doc-id",
      "documentName": "product.pdf",
      "page": 4
    }
  ],
  "conversationId": "conversation-id"
}
🔌 Socket.IO

Socket.IO is included in the technology stack for real-time communication, but the MVP should keep the primary request/response flow REST-based.

Use Socket.IO for:

Real-time chat events
Typing indicators
Message status
CRM notifications
Future live dashboard updates

Do not make the entire application dependent on WebSockets when REST is sufficient.

☁️ Cloudinary

Cloudinary is intended for application-managed image/file assets where appropriate.

Possible MVP uses:

Company Logo
     ↓
Cloudinary


Salesperson Avatar
     ↓
Cloudinary


Other UI Assets
     ↓
Cloudinary

The actual RAG source document should have a separate document-storage strategy and metadata record. Cloudinary should not automatically become the vector/document database.

🧪 Testing Strategy
Backend
tests/
└── api/
    ├── auth.test.js
    ├── leads.test.js
    ├── salespersons.test.js
    ├── documents.test.js
    └── chat.test.js
RAG
tests/
└── rag/
    ├── ingestion.test.js
    ├── chunking.test.js
    ├── retrieval.test.js
    └── generation.test.js
Evaluation Dataset

Maintain a small RAG evaluation set:

Question
Expected Context
Expected Answer
Retrieved Context
Actual Answer
Pass/Fail

This is important because an AI response that sounds correct is not necessarily grounded in the company's actual knowledge.

🔒 Security Requirements

The MVP must include:

JWT authentication
Password hashing
Protected API routes
Request validation
File type validation
File size limits
CORS configuration
Rate limiting
Secure environment variables
API error handling
Tenant/company data isolation
Secure document access
Webhook verification when external channels are introduced
Critical Rule

The LLM should never receive unrestricted database access.

Use:

LLM
 ↓
Structured Output / Tool Request
 ↓
Backend Validation
 ↓
CRM Service
 ↓
Database

Not:

LLM ───────────► Database
🏢 Multi-Tenant Design

If this product will serve multiple companies, tenant isolation must be designed from the beginning.

Every business-owned resource should be associated with a companyId.

Company A
│
├── Users
├── Salespersons
├── Leads
├── Documents
├── Conversations
└── RAG Vectors




Company B
│
├── Users
├── Salespersons
├── Leads
├── Documents
├── Conversations
└── RAG Vectors

RAG retrieval must apply the company/tenant filter.

User Question
      │
      ▼
companyId
      │
      ▼
ChromaDB Filter
      │
      ▼
Only Company's Documents
🚀 MVP Development Phases
Phase 1 — Foundation
Repository setup
React application
Express server
Environment configuration
Database connection
Basic CI/testing setup
Phase 2 — Authentication
Register
Login
Logout
Forgot password
JWT middleware
2FA
Phase 3 — CRM
Dashboard
Salesperson management
Lead management
Lead assignment
Lead status
Phase 4 — Knowledge Base
PDF upload
Document metadata
Text extraction
Chunking
Embedding
ChromaDB storage
Phase 5 — RAG Agent
LangChain setup
Retriever
Prompt
LLM
Context-aware response
Source metadata
Phase 6 — Chat
Conversation UI
Message persistence
Chat API
RAG integration
Loading/error states
Phase 7 — CRM + AI
Conversation → lead
Interest detection
Lead update
High-interest workflow
Salesperson assignment
Phase 8 — Hardening
Testing
Security
Logging
Monitoring
RAG evaluation
Performance optimization
🚫 Out of MVP Scope

The following should not block the first MVP:

WhatsApp Business API
Advanced automatic lead scoring
Voice agent
Multiple messaging platforms
Advanced analytics
Complex AI sales automation
Fully autonomous CRM actions
Large-scale distributed microservices

WhatsApp should be treated as a later communication channel. The original design explicitly chooses a dummy/internal chat interface for the MVP because WhatsApp API access is more difficult to obtain. fileciteturn0file0L700-L734

📦 MVP Definition of Done

The MVP is complete when:

 User can register.
 User can log in.
 JWT-protected routes work.
 Forgot-password flow works.
 2FA works.
 Dashboard is functional.
 Salespersons can be managed.
 Leads can be created and managed.
 Leads can be assigned to salespeople.
 Company/product PDFs can be uploaded.
 Documents can be processed.
 Chunks can be embedded.
 Vectors are stored in ChromaDB.
 User questions retrieve relevant context.
 LLM generates grounded responses.
 Chat interface communicates with the backend.
 Conversations are persisted.
 RAG sources can be displayed.
 Company/tenant data is isolated.
 Basic API and RAG tests pass.
 Security requirements are implemented.
🧭 Final MVP System
                         ┌─────────────────┐
                         │      ADMIN      │
                         └────────┬────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │     CRM DASHBOARD      │
                    │                        │
                    │ Auth                   │
                    │ Salespersons           │
                    │ Leads                  │
                    │ Assignments             │
                    │ Knowledge Base         │
                    └───────────┬────────────┘
                                │
                         REST API / HTTP
                                │
                                ▼
                    ┌────────────────────────┐
                    │    EXPRESS SERVER      │
                    │                        │
                    │ Auth Service            │
                    │ CRM Service             │
                    │ Document Service        │
                    │ Chat Service            │
                    │ RAG Gateway             │
                    └───────┬─────────┬──────┘
                            │         │
                            │         │
                            │         ▼
                            │   ┌─────────────┐
                            │   │  LangChain  │
                            │   │     RAG     │
                            │   └──────┬──────┘
                            │          │
                            │          ▼
                            │   ┌─────────────┐
                            │   │  ChromaDB   │
                            │   └─────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │  Primary DB      │
                    │                  │
                    │ Users            │
                    │ Leads            │
                    │ Salespersons     │
                    │ Documents        │
                    │ Conversations    │
                    │ Messages         │
                    └──────────────────┘




                    CUSTOMER / USER
                          │
                          ▼
                    ┌─────────────┐
                    │  AI CHAT UI │
                    └──────┬──────┘
                           │
                           ▼
                     EXPRESS API
                           │
                           ▼
                       RAG AGENT
                           │
                           ▼
                    ┌─────────────┐
                    │  AI ANSWER  │
                    └──────┬──────┘
                           │
                           ▼
                    CRM / LEAD FLOW
                           │
                           ▼
                    SALES PERSON
🏁 Product Principle

Build the CRM and RAG system as the core product. Treat chat as the first interface and WhatsApp as a future channel.

The MVP should therefore prove one complete business loop:

Company
  ↓
Upload Knowledge
  ↓
RAG Indexing
  ↓
Customer Question
  ↓
AI Retrieval
  ↓
Grounded Response
  ↓
Conversation
  ↓
Lead
  ↓
Salesperson
  ↓
CRM

That loop is the core proof that the product works.
"""

path = Path("/mnt/data/README.md")
path.write_text(readme, encoding="utf-8")
print(path)



STDOUT/STDERR
/mnt/data/README.md


Done. I created the complete MVP README.md with:

Full project/repository structure
MVP architecture
RAG data flow
CRM flow
Authentication flow
Chat flow
Tech stack and technology icons
React + Tailwind + Lucide
Node.js + Express + Cloudinary + Socket.IO
LangChain + ChromaDB + Hugging Face
Database models
API structure
RAG API contract
Multi-tenant architecture
Security requirements
Testing strategy
Development phases
MVP definition of done
WhatsApp explicitly kept out of the initial MVP
Complete end-to-end line-draw architecture