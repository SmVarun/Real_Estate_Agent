# AI Sales CRM + RAG Agent — Database Design

## 1. Purpose

This document defines the database architecture for the AI Sales CRM + RAG Agent.

The system uses two separate data layers:

```text
Primary Application Database
        │
        ├── Users
        ├── Companies
        ├── Salespersons
        ├── Leads
        ├── Assignments
        ├── Documents
        ├── Conversations
        └── Messages

                +

              ChromaDB
                │
                ├── Document chunks
                ├── Embeddings
                └── Vector metadata
```

The primary database is the **source of truth for CRM and application data**.

ChromaDB is the **vector database for the RAG system**.

ChromaDB must not be used as the primary CRM database.

---

# 2. Database Architecture

```text
                         APPLICATION
                              │
                              ▼
                     Node.js / Express
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
        ┌─────────────────┐       ┌─────────────────┐
        │ Primary Database│       │    ChromaDB     │
        │                 │       │                 │
        │ Business Data   │       │ Vector Data     │
        │ CRM Data        │       │                 │
        │ Auth Data       │       │ Embeddings      │
        │ Chat Data       │       │ Chunks          │
        └─────────────────┘       │ Metadata        │
                                  └─────────────────┘
```

---

# 3. Primary Database Responsibilities

The primary database stores structured application data.

It is responsible for:

* Authentication
* User management
* Company/tenant management
* Salesperson management
* Lead management
* Lead assignments
* Document metadata
* Conversations
* Messages
* CRM activity
* Application/session metadata

The primary database should remain independent of the vector database.

---

# 4. Core Entities

The initial database model contains the following entities:

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
            │
            └── Messages
```

Additional relationship:

```text
Lead
  │
  └── Salesperson Assignment
```

---

# 5. Entity Relationship Diagram

```text
                         ┌──────────────────┐
                         │     COMPANY      │
                         │──────────────────│
                         │ id               │
                         │ name             │
                         │ status           │
                         │ created_at       │
                         │ updated_at       │
                         └────────┬─────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
     │    USERS     │     │ SALESPERSONS │     │    LEADS     │
     │──────────────│     │──────────────│     │──────────────│
     │ id           │     │ id           │     │ id           │
     │ company_id   │     │ company_id   │     │ company_id   │
     │ email        │     │ name         │     │ name         │
     │ role         │     │ email        │     │ status       │
     │ password     │     │ status       │     │ interest     │
     └──────────────┘     └──────┬───────┘     └──────┬───────┘
                                 │                    │
                                 └────────┬───────────┘
                                          │
                                          ▼
                                  ┌────────────────┐
                                  │ LEAD ASSIGNMENT│
                                  │────────────────│
                                  │ id             │
                                  │ lead_id        │
                                  │ salesperson_id │
                                  │ assigned_at    │
                                  └────────────────┘


     ┌──────────────────┐
     │    DOCUMENTS     │
     │──────────────────│
     │ id               │
     │ company_id       │
     │ uploaded_by      │
     │ filename         │
     │ status           │
     │ file_url         │
     └────────┬─────────┘
              │
              │
              ▼
        ┌───────────────┐
        │   CHROMADB    │
        │───────────────│
        │ chunks        │
        │ embeddings    │
        │ metadata      │
        └───────────────┘


     ┌──────────────────┐
     │  CONVERSATIONS   │
     │──────────────────│
     │ id               │
     │ company_id       │
     │ customer/user_id │
     │ lead_id          │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │     MESSAGES     │
     │──────────────────│
     │ id               │
     │ conversation_id  │
     │ sender           │
     │ content          │
     │ metadata         │
     │ created_at       │
     └──────────────────┘
```

---

# 6. Company

The `companies` table represents a company/tenant using the CRM.

## Fields

```text
companies
│
├── id
├── name
├── status
├── created_at
└── updated_at
```

### Responsibilities

The company entity provides the tenant boundary for the application.

Most business entities should contain:

```text
company_id
```

This allows the backend to enforce company-level isolation.

---

# 7. Users

The `users` table represents authenticated application users.

## Fields

```text
users
│
├── id
├── company_id
├── name
├── email
├── password_hash
├── role
├── status
├── email_verified
├── last_login_at
├── created_at
└── updated_at
```

## Roles

Initial roles:

```text
ADMIN
SALESPERSON
```

A customer interacting through chat does not necessarily need to be represented as an authenticated CRM user.

That decision can be expanded later.

---

# 8. User Role Model

```text
Company
   │
   ├── ADMIN
   │     │
   │     ├── Manage salespersons
   │     ├── Manage leads
   │     ├── Upload documents
   │     └── Manage company data
   │
   └── SALESPERSON
         │
         ├── View assigned leads
         ├── Update leads
         └── Handle customer conversations
```

Authorization should be handled by the backend.

The database stores the role; middleware determines whether the user is allowed to perform an operation.

---

# 9. Salespersons

The `salespersons` table stores sales team information.

## Fields

```text
salespersons
│
├── id
├── company_id
├── user_id
├── name
├── email
├── phone
├── role
├── status
├── created_at
└── updated_at
```

A salesperson may be linked to an authenticated user through:

```text
salespersons.user_id
```

This allows CRM-specific salesperson information to remain separate from authentication data.

---

# 10. Leads

The `leads` table is one of the central CRM entities.

## Fields

```text
leads
│
├── id
├── company_id
├── name
├── email
├── phone
├── product_interest
├── interest_level
├── source
├── status
├── assigned_salesperson_id
├── notes
├── last_interaction_at
├── created_at
└── updated_at
```

---

# 11. Lead Status

Initial lifecycle:

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

The status should be represented using a controlled enum/value set rather than unrestricted text.

---

# 12. Interest Level

Interest should be represented separately from lead status.

Example:

```text
LOW
MEDIUM
HIGH
```

This allows the system to distinguish:

```text
Lead Status
    +
Interest Level
```

Example:

```text
status = INTERESTED
interest_level = HIGH
```

This can later be used by the AI lead-detection system.

---

# 13. Lead Assignment

Lead assignment can initially be stored directly on the lead:

```text
leads.assigned_salesperson_id
```

For more complete assignment history, use a separate assignment table.

## Lead Assignments

```text
lead_assignments
│
├── id
├── lead_id
├── salesperson_id
├── assigned_by
├── assigned_at
└── unassigned_at
```

This allows the system to preserve assignment history.

Example:

```text
Lead
 │
 ├── Assigned → Salesperson A
 │
 ├── Reassigned → Salesperson B
 │
 └── Current → Salesperson B
```

For the MVP, the current assignment can remain on the `leads` table while `lead_assignments` provides historical tracking if required.

---

# 14. Documents

The `documents` table stores metadata about uploaded company knowledge.

The original document itself should be stored in file storage.

## Fields

```text
documents
│
├── id
├── company_id
├── uploaded_by
├── filename
├── original_filename
├── file_type
├── file_size
├── file_url
├── document_type
├── status
├── error_message
├── created_at
└── updated_at
```

---

# 15. Document Types

Initial document types may include:

```text
COMPANY
PRODUCT
POLICY
FAQ
SALES_GUIDELINE
OTHER
```

The exact values can be expanded as the product grows.

---

# 16. Document Processing Status

The document ingestion system should track processing state.

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

Failure state:

```text
FAILED
```

Example:

```text
documents.status = INDEXED
```

means the document has successfully reached the vector database.

---

# 17. Document → ChromaDB Relationship

The primary database does not store the actual embeddings.

Instead:

```text
Document
   │
   ├── document_id
   ├── company_id
   └── metadata
          │
          ▼
      ChromaDB
          │
          ├── chunk
          ├── embedding
          └── metadata
```

ChromaDB metadata should contain at least:

```json
{
  "document_id": "...",
  "company_id": "...",
  "document_type": "...",
  "page_number": 1,
  "chunk_id": "...",
  "source": "..."
}
```

---

# 18. Conversations

The `conversations` table stores chat sessions.

## Fields

```text
conversations
│
├── id
├── company_id
├── user_id
├── lead_id
├── channel
├── status
├── created_at
└── updated_at
```

## Channel

Initial value:

```text
INTERNAL_CHAT
```

Future:

```text
WHATSAPP
```

This allows multiple communication channels to use the same conversation model.

---

# 19. Messages

The `messages` table stores individual conversation messages.

## Fields

```text
messages
│
├── id
├── conversation_id
├── sender_type
├── sender_id
├── content
├── message_type
├── sources
├── metadata
├── created_at
└── updated_at
```

---

# 20. Sender Types

Initial sender types:

```text
CUSTOMER
AI
SALESPERSON
SYSTEM
```

Example:

```text
Conversation
│
├── CUSTOMER
├── AI
├── CUSTOMER
├── AI
├── SALESPERSON
└── CUSTOMER
```

---

# 21. Message Metadata

AI-generated messages may contain additional metadata.

Example:

```json
{
  "model": "selected-model",
  "retrieval_count": 5,
  "latency_ms": 820,
  "confidence": {},
  "intent": "PRODUCT_INQUIRY"
}
```

The exact structure can evolve during implementation.

---

# 22. Message Sources

RAG-generated responses should be capable of referencing their sources.

Example:

```json
[
  {
    "document_id": "...",
    "page": 4,
    "chunk_id": "...",
    "source": "product-guide.pdf"
  }
]
```

This allows the UI to display:

```text
AI Answer

Sources:
• Product Guide — Page 4
• Pricing Document — Page 2
```

---

# 23. Conversation → Lead Relationship

A conversation may be linked to a CRM lead.

```text
Customer
   │
   ▼
Conversation
   │
   ▼
Lead
   │
   ▼
Salesperson
```

This enables:

```text
Chat History
      +
Customer Information
      +
CRM Lead
      +
Salesperson
```

The relationship should be optional because not every conversation immediately represents a qualified lead.

---

# 24. AI → CRM Data

The AI should not directly write arbitrary data to the database.

Instead, it produces structured information.

Example:

```json
{
  "intent": "PURCHASE",
  "interest": "HIGH",
  "callback_required": true,
  "product": "Product X"
}
```

Backend flow:

```text
AI Output
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

This keeps database mutations under backend control.

---

# 25. Activity Tracking

The initial README does not define a complete activity schema.

For MVP, activity tracking can remain minimal.

If implemented, a future structure could be:

```text
activities
│
├── id
├── company_id
├── user_id
├── lead_id
├── type
├── description
├── metadata
└── created_at
```

Possible activity types:

```text
LEAD_CREATED
LEAD_UPDATED
LEAD_ASSIGNED
MESSAGE_SENT
MESSAGE_RECEIVED
CALLBACK_REQUESTED
STATUS_CHANGED
```

This should be finalized before implementation if activity tracking is included in the MVP.

---

# 26. Authentication / Session Data

Authentication-related metadata should remain separate from CRM entities.

Possible future structure:

```text
sessions
│
├── id
├── user_id
├── refresh_token_hash
├── expires_at
├── revoked_at
├── ip_address
├── user_agent
└── created_at
```

The exact session strategy depends on the final JWT/refresh-token implementation.

---

# 27. Database Indexing Strategy

Indexes should be created around frequently queried fields.

Important candidates:

```text
users
├── email
└── company_id

salespersons
├── company_id
├── email
└── status

leads
├── company_id
├── status
├── interest_level
├── assigned_salesperson_id
└── created_at

documents
├── company_id
├── status
└── created_at

conversations
├── company_id
├── lead_id
├── user_id
└── created_at

messages
├── conversation_id
└── created_at
```

The exact indexes should be validated using actual query patterns during implementation.

---

# 28. Tenant Isolation

Every tenant-sensitive table should be company-aware.

Example:

```text
users.company_id
salespersons.company_id
leads.company_id
documents.company_id
conversations.company_id
```

The backend must always resolve the company from the authenticated context.

Example:

```text
JWT
 │
 ▼
userId
 │
 ▼
companyId
 │
 ▼
Database Query
```

Incorrect:

```sql
SELECT * FROM leads;
```

Correct concept:

```sql
SELECT *
FROM leads
WHERE company_id = :companyId;
```

The same principle applies to RAG retrieval.

---

# 29. RAG Tenant Isolation

Vector retrieval must also be company-aware.

```text
User Question
      │
      ▼
Authenticated Company
      │
      ▼
company_id
      │
      ▼
ChromaDB Metadata Filter
      │
      ▼
Relevant Company Chunks
```

Never perform unrestricted global retrieval in a multi-company environment.

---

# 30. Data Ownership

The ownership model should follow:

```text
Company
  │
  ├── User
  ├── Salesperson
  ├── Lead
  ├── Document
  └── Conversation
```

A user belongs to one company in the initial architecture.

A lead belongs to one company.

A document belongs to one company.

A conversation belongs to one company.

This keeps tenant boundaries explicit.

---

# 31. Data Lifecycle

## Lead

```text
Created
   ↓
Updated
   ↓
Assigned
   ↓
Contacted
   ↓
Qualified
   ↓
Converted / Lost
```

## Document

```text
Uploaded
   ↓
Processed
   ↓
Indexed
   ↓
Available for RAG
```

## Conversation

```text
Created
   ↓
Active
   ↓
Updated
   ↓
Closed
```

---

# 32. Data Deletion Considerations

Deleting a document from the primary database must not leave orphaned vectors.

Required conceptual flow:

```text
Delete Document
      │
      ▼
Delete / invalidate ChromaDB chunks
      │
      ▼
Delete file
      │
      ▼
Delete database metadata
```

The exact deletion strategy should be implemented transactionally where possible.

For vector storage, cleanup must be explicitly handled because ChromaDB is separate from the primary database.

---

# 33. Data Consistency

The primary database is authoritative for:

```text
Users
Companies
Salespersons
Leads
Documents
Conversations
Messages
```

ChromaDB is authoritative only for:

```text
Embeddings
Vector chunks
Retrieval metadata
```

The system should never assume that a successful database insert automatically means vector indexing succeeded.

Example:

```text
Document Created
      │
      ▼
RAG Processing
      │
      ├── SUCCESS → INDEXED
      │
      └── FAILURE → FAILED
```

---

# 34. Database Technology Decision

The project architecture requires a relational/application database for structured CRM data and ChromaDB specifically for vector data.

The exact relational database engine should be finalized during Phase 0 before implementation.

Recommended decision record:

```text
Primary Database:
[FINALIZE]

Vector Database:
ChromaDB

ORM / Query Layer:
[FINALIZE]
```

No database engine should be hard-coded into the architecture document until the team makes this decision.

---

# 35. Recommended Database Module Structure

Backend database-related code should follow:

```text
server/src/
│
├── models/
│   ├── user
│   ├── company
│   ├── salesperson
│   ├── lead
│   ├── lead-assignment
│   ├── document
│   ├── conversation
│   └── message
│
├── repositories/
│   ├── user.repository
│   ├── company.repository
│   ├── salesperson.repository
│   ├── lead.repository
│   ├── document.repository
│   ├── conversation.repository
│   └── message.repository
│
└── services/
    ├── user.service
    ├── company.service
    ├── salesperson.service
    ├── lead.service
    ├── document.service
    ├── conversation.service
    └── message.service
```

Repositories handle database access.

Services handle business logic.

Controllers should not contain raw database logic.

---

# 36. Database Request Flow

```text
HTTP Request
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
Primary Database
```

For RAG:

```text
HTTP Request
     │
     ▼
Controller
     │
     ▼
RAG Service
     │
     ├── Primary DB
     │
     └── ChromaDB
```

---

# 37. Complete Database Flow

```text
                         USER
                          │
                          ▼
                    Express API
                          │
                          ▼
                    Authentication
                          │
                          ▼
                       companyId
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
      Primary Database             RAG System
             │                         │
       ┌─────┼─────┐                   ▼
       │     │     │                ChromaDB
       ▼     ▼     ▼                   │
     Leads Users Docs                  │
       │                               │
       │                               ▼
       │                          Relevant Chunks
       │                               │
       └──────────────┬────────────────┘
                      │
                      ▼
                    LLM
                      │
                      ▼
               Structured Result
                      │
                      ▼
                 CRM Service
                      │
                      ▼
                Lead Update
```

---

# 38. Database Design Rules

The following rules should be treated as architectural constraints.

### Rule 1

The primary database is the source of truth for CRM data.

### Rule 2

ChromaDB is only the vector database.

### Rule 3

Every tenant-owned entity must contain a company relationship.

### Rule 4

RAG retrieval must enforce company isolation.

### Rule 5

AI must never directly execute arbitrary database mutations.

### Rule 6

Document metadata belongs in the primary database.

### Rule 7

Embeddings belong in ChromaDB.

### Rule 8

Conversation messages belong in the primary database.

### Rule 9

Database access should happen through repositories/services.

### Rule 10

The frontend must never directly access either database.

---

# 39. Phase 0 Database Deliverables

Before Phase 1 begins, the following should be finalized:

```text
✓ Entity list
✓ ER diagram
✓ Company/tenant model
✓ User model
✓ Role model
✓ Salesperson model
✓ Lead model
✓ Lead lifecycle
✓ Lead assignment model
✓ Document model
✓ Document status
✓ Conversation model
✓ Message model
✓ RAG metadata structure
✓ ChromaDB metadata
✓ Tenant isolation strategy
✓ Indexing strategy
✓ Data ownership
✓ Data deletion strategy
✓ Database technology
✓ ORM/query layer
```

---

# 40. Database Definition of Done

The database design phase is complete when:

```text
Primary Database
        │
        ├── Companies
        ├── Users
        ├── Salespersons
        ├── Leads
        ├── Assignments
        ├── Documents
        ├── Conversations
        └── Messages

               +

            ChromaDB
               │
               ├── Chunks
               ├── Embeddings
               └── Metadata
```

has clearly defined ownership, relationships, tenant isolation, indexing, and lifecycle rules.

After this is approved:

```text
PHASE 0
Architecture + Database Design
              │
              ▼
       DATABASE FREEZE
              │
              ▼
PHASE 1
Backend + Authentication
```

The database should not be redesigned casually during Phase 1. Any required schema changes should be documented as migrations.
