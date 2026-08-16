# AI Sales CRM + RAG Agent — RAG Architecture

## 1. Purpose

This document defines the Retrieval-Augmented Generation (RAG) architecture for the AI Sales CRM + RAG Agent.

The RAG system is responsible for transforming company and product information into searchable AI knowledge and using that knowledge to generate grounded responses.

The core flow is:

```text
Company Knowledge
      │
      ▼
Document Ingestion
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
Embeddings
      │
      ▼
ChromaDB
      │
      ▼
Retrieval
      │
      ▼
Context
      │
      ▼
LLM
      │
      ▼
Grounded Response
```

The README defines the RAG layer using **JavaScript/Node.js, LangChain.js, ChromaDB, Hugging Face embeddings, and an LLM provider/local LLM to be finalized during implementation**.

---

# 2. RAG Architecture

The RAG system has two major pipelines:

```text
┌────────────────────────────────────────────┐
│                RAG SYSTEM                  │
│                                            │
│  ┌──────────────────┐                      │
│  │ Ingestion Pipeline│                      │
│  └─────────┬────────┘                      │
│            │                               │
│            ▼                               │
│      Document → Chunks → Embeddings        │
│            │                               │
│            ▼                               │
│         ChromaDB                           │
│                                            │
│  ┌──────────────────┐                      │
│  │  Query Pipeline  │                      │
│  └─────────┬────────┘                      │
│            │                               │
│            ▼                               │
│     Question → Retrieval → Context        │
│            │                               │
│            ▼                               │
│           LLM                              │
│            │                               │
│            ▼                               │
│         Answer                             │
└────────────────────────────────────────────┘
```

---

# 3. RAG Technology Stack

## Core Technologies

```text
Language
└── JavaScript / Node.js

RAG Framework
└── LangChain.js

Vector Database
└── ChromaDB

Embedding Model
└── Hugging Face Embeddings

LLM
└── Provider / Local LLM
```

The exact LLM provider is intentionally left as a Phase 0/implementation decision because the project README does not finalize it.

---

# 4. RAG Responsibilities

The RAG layer is responsible for:

```text
✓ Document processing
✓ Text extraction
✓ Text cleaning
✓ Chunking
✓ Embedding generation
✓ Vector storage
✓ Similarity retrieval
✓ Context construction
✓ Prompt construction
✓ LLM interaction
✓ Grounded response generation
✓ Source references
```

The RAG layer is **not** responsible for:

```text
✗ User authentication
✗ CRM authorization
✗ Direct CRM database mutations
✗ User management
✗ Salesperson management
✗ Lead assignment
```

Those responsibilities remain with the Express backend and CRM services.

---

# 5. High-Level RAG Architecture

```text
                         ┌─────────────────┐
                         │   React Chat    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Express API    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    RAG Agent    │
                         │   LangChain.js  │
                         └────────┬────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
            Retriever        Prompt Builder      LLM
                 │                │                │
                 ▼                └────────┬───────┘
            ChromaDB                       │
                 │                         │
                 ▼                         ▼
            Relevant                   Response
             Chunks
```

---

# 6. Knowledge Sources

The initial MVP should support company/product information primarily through PDF documents.

The README identifies the following information categories:

```text
Company
├── Company overview
├── Business model
├── Services
├── Policies
├── Contact information
└── FAQs

Product
├── Description
├── Features
├── Pricing
├── Specifications
├── Benefits
├── Limitations
└── FAQs

Business / Sales
├── Sales guidelines
├── Product comparison
├── Qualification rules
├── Common objections
├── Sales scripts
└── Policies
```

The initial document format is PDF, with DOCX, TXT, web pages, URLs, JSON, and CSV planned for future expansion.

---

# 7. Document Ingestion Pipeline

The complete ingestion pipeline is:

```text
PDF Upload
    │
    ▼
File Validation
    │
    ▼
Original File Storage
    │
    ▼
Document Metadata
    │
    ▼
Text Extraction
    │
    ▼
Text Cleaning
    │
    ▼
Document Object
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
INDEXED
```

This follows the architecture defined in the project README.

---

# 8. Document Upload

The frontend sends the document to the Express backend.

```text
Admin
 │
 ▼
React Dashboard
 │
 ▼
POST /api/v1/documents
 │
 ▼
Express
 │
 ├── Authentication
 ├── Authorization
 └── File Validation
        │
        ▼
    File Storage
        │
        ▼
  Document Metadata
        │
        ▼
  RAG Ingestion
```

The frontend should never upload directly to ChromaDB.

---

# 9. Document Metadata

Document metadata is stored in the primary application database.

Example:

```json
{
  "id": "document_123",
  "companyId": "company_123",
  "uploadedBy": "user_123",
  "filename": "product-guide.pdf",
  "fileType": "application/pdf",
  "documentType": "PRODUCT",
  "status": "PROCESSING",
  "fileUrl": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

The primary database therefore maintains the lifecycle and ownership of the document.

---

# 10. Document Processing States

The ingestion pipeline should expose processing status.

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

Example:

```json
{
  "documentId": "document_123",
  "status": "INDEXED"
}
```

---

# 11. Text Extraction

The first MVP supports PDF documents.

```text
PDF
 │
 ▼
PDF Loader
 │
 ▼
Raw Text
 │
 ▼
Document Object
```

The extracted document should preserve useful metadata where possible, especially:

```text
documentId
companyId
pageNumber
source
```

This metadata becomes important when displaying source references to users.

---

# 12. Text Cleaning

Raw extracted text should be cleaned before chunking.

Conceptually:

```text
Raw Text
   │
   ▼
Remove unnecessary formatting
   │
   ▼
Normalize whitespace
   │
   ▼
Remove extraction artifacts
   │
   ▼
Clean Text
```

The cleaning stage should avoid removing meaningful business information.

---

# 13. Document Object

Before chunking, extracted text should be represented as a document object containing content and metadata.

Conceptually:

```json
{
  "pageContent": "Product X provides...",
  "metadata": {
    "documentId": "document_123",
    "companyId": "company_123",
    "documentType": "PRODUCT",
    "pageNumber": 4,
    "source": "product-guide.pdf"
  }
}
```

This metadata should travel through the RAG pipeline.

---

# 14. Chunking

Large documents should not be passed directly to the LLM.

Instead:

```text
Document
   │
   ▼
Chunking
   │
   ├── Chunk 1
   ├── Chunk 2
   ├── Chunk 3
   ├── Chunk 4
   └── ...
```

The README explicitly states that chunk size and overlap should be tested rather than blindly fixed.

---

# 15. Chunk Design

Each chunk should contain:

```text
Content
+
Metadata
```

Example:

```json
{
  "text": "Product X supports...",
  "metadata": {
    "documentId": "document_123",
    "companyId": "company_123",
    "documentType": "PRODUCT",
    "pageNumber": 4,
    "chunkId": "chunk_004"
  }
}
```

---

# 16. Chunk Size and Overlap

The initial implementation should make these configurable.

```text
CHUNK_SIZE=
CHUNK_OVERLAP=
```

Do not assume one universal chunk configuration is optimal.

Evaluation should determine whether:

```text
Small chunks
```

or:

```text
Large chunks
```

provide better retrieval quality for the company's documents.

---

# 17. Embedding Pipeline

Each chunk is converted into a numerical vector.

```text
Text Chunk
    │
    ▼
Hugging Face Embedding Model
    │
    ▼
Vector
```

Example conceptually:

```text
"Product X provides..."
             │
             ▼
[0.023, -0.184, 0.712, ...]
```

The actual vector dimensions depend on the selected embedding model.

---

# 18. Embedding Strategy

Embeddings should be generated during ingestion.

```text
Document
   │
   ▼
Chunks
   │
   ▼
Embedding Model
   │
   ▼
Vectors
   │
   ▼
ChromaDB
```

The same embedding model configuration should be used consistently for indexing and querying.

---

# 19. ChromaDB Architecture

ChromaDB stores:

```text
Vector
+
Chunk
+
Metadata
```

Conceptually:

```text
ChromaDB
│
├── Vector
├── Document Chunk
└── Metadata
      ├── companyId
      ├── documentId
      ├── documentType
      ├── pageNumber
      ├── chunkId
      └── source
```

---

# 20. ChromaDB Collection Strategy

The exact collection strategy should be finalized during implementation.

The architecture should support company isolation.

Possible conceptual model:

```text
ChromaDB
│
└── Knowledge Collection
      │
      ├── Company A vectors
      ├── Company B vectors
      └── Company C vectors
```

Retrieval must apply company filtering.

The system must never return vectors belonging to another company.

---

# 21. Tenant Isolation

This is a critical RAG requirement.

```text
Authenticated User
        │
        ▼
     companyId
        │
        ▼
       RAG
        │
        ▼
   ChromaDB Search
        │
        ▼
companyId = authenticated company
        │
        ▼
Relevant Chunks
```

Example:

```text
Company A
   │
   ├── Document A1
   ├── Document A2
   └── Document A3

Company B
   │
   ├── Document B1
   └── Document B2
```

A query from Company A must retrieve:

```text
A1 / A2 / A3
```

and never:

```text
B1 / B2
```

The README explicitly requires company isolation at the retrieval layer.

---

# 22. RAG Query Pipeline

The query pipeline is:

```text
User Question
      │
      ▼
Express API
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
Tenant Filter
      │
      ▼
Top Relevant Chunks
      │
      ▼
Context Builder
      │
      ▼
Prompt
      │
      ▼
LLM
      │
      ▼
Final Answer
```

The README describes the retrieval sequence as question → embedding → similarity search → relevant chunks.

---

# 23. Question Embedding

The user question must be converted into an embedding using the same compatible embedding model used for document chunks.

```text
User Question
      │
      ▼
Embedding Model
      │
      ▼
Question Vector
```

Example:

```text
"What are the features of Product X?"
                │
                ▼
          Query Vector
```

---

# 24. Similarity Search

The query vector is compared with vectors stored in ChromaDB.

```text
Query Vector
     │
     ▼
ChromaDB
     │
     ▼
Similarity Search
     │
     ▼
Top-K Results
```

Conceptually:

```text
Query
 │
 ├── Chunk A → high relevance
 ├── Chunk B → high relevance
 ├── Chunk C → medium relevance
 ├── Chunk D → low relevance
 └── Chunk E → low relevance
```

Only the most relevant context should be passed to the LLM.

---

# 25. Retrieval Configuration

The retrieval system should expose configurable parameters.

Example:

```text
TOP_K=
SIMILARITY_THRESHOLD=
```

The exact values should be determined through evaluation.

Do not hard-code retrieval values without measuring their impact on answer quality.

---

# 26. Context Builder

Retrieved chunks are combined into a structured context.

```text
Retrieved Chunk 1
        +
Retrieved Chunk 2
        +
Retrieved Chunk 3
        │
        ▼
     Context
```

Example:

```text
CONTEXT

[Source: product-guide.pdf, Page 4]
Product X provides...

[Source: pricing.pdf, Page 2]
Product X is available...

[Source: faq.pdf, Page 7]
Customers can...
```

This gives the LLM the information required to generate the response.

---

# 27. Prompt Architecture

The final prompt should conceptually contain:

```text
System Instructions
        +
Retrieved Context
        +
Conversation History
        +
User Question
```

Flow:

```text
System Prompt
     │
     +
Retrieved Context
     │
     +
Conversation History
     │
     +
User Question
     │
     ▼
   Prompt
     │
     ▼
     LLM
```

---

# 28. Grounding Rules

The RAG agent should be instructed to:

```text
✓ Use retrieved company knowledge
✓ Prefer company knowledge over generic assumptions
✓ Avoid inventing company information
✓ Clearly state when information is unavailable
✓ Use retrieved context to answer the question
✓ Preserve source references
```

These grounding requirements are explicitly defined in the README.

---

# 29. Hallucination Control

The RAG system should not assume that the LLM is always correct.

Conceptual policy:

```text
Question
   │
   ▼
Retrieve Context
   │
   ▼
Is relevant information available?
   │
   ├── YES
   │    │
   │    ▼
   │   Answer from context
   │
   └── NO
        │
        ▼
   State that information
   is unavailable
```

The agent should not fabricate:

```text
Prices
Features
Policies
Company facts
Product specifications
Business rules
```

when they are not present in the knowledge base.

---

# 30. Source References

The RAG response should retain information about the chunks used to generate the answer.

Example:

```json
{
  "sources": [
    {
      "documentId": "document_123",
      "page": 4,
      "chunkId": "chunk_004",
      "source": "product-guide.pdf"
    }
  ]
}
```

The frontend can use this information to display:

```text
Sources

Product Guide
Page 4
```

---

# 31. Conversation Context

The RAG system may receive conversation history.

Example:

```text
User:
What is Product X?

AI:
Product X is...

User:
What is its pricing?
```

The second question depends on the previous conversation.

Conceptually:

```text
Conversation History
        +
Current Question
        │
        ▼
Query Understanding
        │
        ▼
Retrieval
```

The exact conversation-window and history-management strategy should be finalized during implementation.

---

# 32. Conversation vs Knowledge Retrieval

Conversation history and company knowledge are separate sources.

```text
Conversation History
        │
        ├──────────────┐
        │              │
        ▼              ▼
Current Question    Company Knowledge
        │              │
        └──────┬───────┘
               ▼
             LLM
```

The LLM should use company knowledge as the authoritative source for company-specific facts.

---

# 33. RAG Agent Structure

Recommended module:

```text
server/src/rag/
│
├── loaders/
│   └── pdf.loader.js
│
├── processors/
│   └── text.processor.js
│
├── chunkers/
│   └── document.chunker.js
│
├── embeddings/
│   └── embedding.service.js
│
├── vectorstore/
│   └── chroma.service.js
│
├── retrievers/
│   └── retriever.service.js
│
├── prompts/
│   ├── system.prompt.js
│   └── rag.prompt.js
│
├── chains/
│   └── rag.chain.js
│
├── agent/
│   └── sales.agent.js
│
└── rag.service.js
```

The exact module names can change during implementation, but responsibilities should remain separated.

---

# 34. RAG Service Responsibilities

The central RAG service should orchestrate the pipeline.

Conceptually:

```text
RAGService
│
├── ingestDocument()
├── processDocument()
├── generateEmbeddings()
├── indexChunks()
├── retrieveContext()
├── buildPrompt()
├── generateResponse()
└── getSources()
```

It should not directly own CRM business logic.

---

# 35. Ingestion Service

Conceptual responsibility:

```text
IngestionService
│
├── load()
├── extract()
├── clean()
├── chunk()
├── embed()
└── index()
```

Flow:

```text
File
 │
 ▼
Load
 │
 ▼
Extract
 │
 ▼
Clean
 │
 ▼
Chunk
 │
 ▼
Embed
 │
 ▼
Index
```

---

# 36. Retrieval Service

Conceptual responsibility:

```text
RetrieverService
│
├── embedQuery()
├── applyTenantFilter()
├── similaritySearch()
└── returnRelevantChunks()
```

Flow:

```text
Question
 │
 ▼
Embedding
 │
 ▼
Tenant Filter
 │
 ▼
Similarity Search
 │
 ▼
Relevant Chunks
```

---

# 37. LLM Service

The LLM should be abstracted behind a service.

```text
LLMService
│
└── generateResponse()
```

Conceptually:

```text
RAG Agent
    │
    ▼
LLM Adapter
    │
    ├── Provider A
    └── Provider B / Local Model
```

This keeps the RAG system independent from a specific LLM provider.

The README leaves the final LLM provider/local model decision open.

---

# 38. RAG API Integration

The frontend communicates with RAG through Express.

```text
React
 │
 ▼
POST /api/v1/chat
 │
 ▼
Express
 │
 ▼
Chat Service
 │
 ▼
RAG Service
```

The frontend never directly accesses:

```text
ChromaDB
LLM
Embedding Model
```

---

# 39. RAG Request Contract

Conceptually:

```json
{
  "conversationId": "conversation_123",
  "message": "What are the features of Product X?"
}
```

The backend derives:

```text
companyId
userId
conversation context
```

from authenticated application context.

---

# 40. RAG Internal Request

The RAG layer should receive:

```json
{
  "companyId": "company_123",
  "conversationId": "conversation_123",
  "message": "What are the features of Product X?"
}
```

This allows retrieval to remain tenant-aware.

---

# 41. RAG Response Contract

The RAG response should conceptually contain:

```json
{
  "answer": "Product X provides...",
  "sources": [
    {
      "documentId": "document_123",
      "page": 4,
      "source": "product-guide.pdf"
    }
  ],
  "metadata": {
    "retrievalCount": 5
  }
}
```

The README proposes `answer`, `conversationId`, `sources`, and confidence/metadata as the eventual API response structure.

---

# 42. RAG + CRM Integration Boundary

The RAG agent can identify sales-related signals.

Examples:

```text
Product inquiry
Pricing inquiry
High purchase intent
Callback request
Salesperson request
Product comparison
Objection
Follow-up requirement
```

However:

```text
RAG / LLM
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

The AI must not directly modify CRM records.

This separation is explicitly required by the project architecture.

---

# 43. Example AI → CRM Flow

Customer:

```text
"I want to buy Product X. Can someone call me?"
```

RAG/AI:

```json
{
  "intent": "PURCHASE",
  "interest": "HIGH",
  "callbackRequired": true
}
```

Backend:

```text
Validate
   │
   ▼
Create / Update Lead
   │
   ▼
Assign / Flag Lead
```

CRM:

```text
Lead
 ├── Status = INTERESTED
 ├── Interest = HIGH
 └── Callback = REQUIRED
```

---

# 44. Retrieval Failure Handling

If ChromaDB is unavailable:

```text
User Question
     │
     ▼
RAG Service
     │
     ▼
ChromaDB Failure
     │
     ▼
Controlled Error
```

The API should return a normalized error rather than an internal stack trace.

Example:

```json
{
  "success": false,
  "error": {
    "code": "RAG_RETRIEVAL_FAILED",
    "message": "Knowledge retrieval is temporarily unavailable"
  }
}
```

---

# 45. LLM Failure Handling

If the LLM is unavailable:

```text
Retrieve Context
      │
      ▼
LLM Request
      │
      ▼
Failure
      │
      ▼
Controlled API Error
```

The system should not fabricate a response simply because retrieval succeeded.

---

# 46. Empty Retrieval Handling

If no relevant information is found:

```text
Question
   │
   ▼
Retrieval
   │
   ▼
No Relevant Chunks
   │
   ▼
Grounded Fallback
```

Example behavior:

```text
"I couldn't find this information in the company's knowledge base."
```

The exact user-facing wording can be finalized during prompt design.

---

# 47. RAG Evaluation

A dedicated evaluation dataset should be created.

The README recommends evaluating:

```text
Question
Expected Answer
Retrieved Context
Actual Answer
```

The evaluation should measure:

```text
Retrieval Accuracy
Relevant Chunk Selection
Hallucination Rate
Answer Correctness
Response Latency
```

---

# 48. RAG Evaluation Flow

```text
Test Question
      │
      ▼
RAG Retrieval
      │
      ▼
Retrieved Chunks
      │
      ▼
LLM
      │
      ▼
Generated Answer
      │
      ▼
Compare with Expected Answer
      │
      ▼
Evaluation Metrics
```

---

# 49. Retrieval Evaluation

Evaluate:

```text
Question
   │
   ▼
Retrieved Chunks
   │
   ▼
Are relevant chunks present?
```

Important metrics include:

```text
Relevant retrieval
Irrelevant retrieval
Missing information
Top-K effectiveness
```

The exact evaluation methodology should be established during the testing phase.

---

# 50. Hallucination Evaluation

Test questions should include questions where:

```text
Information exists
```

and:

```text
Information does not exist
```

Expected behavior:

```text
Information exists
      ↓
Answer using knowledge

Information unavailable
      ↓
Clearly state unavailable
```

This is essential for a company-facing sales assistant.

---

# 51. RAG Observability

The RAG system should record useful operational metrics.

Potential metadata:

```text
requestId
companyId
conversationId
documentCount
retrievalCount
retrievalLatency
embeddingLatency
llmLatency
totalLatency
model
```

Do not log sensitive conversation data unnecessarily.

---

# 52. RAG Security

Security requirements include:

```text
✓ Tenant-aware retrieval
✓ Authenticated API access
✓ File validation
✓ File size limits
✓ Secure file storage
✓ No direct frontend access to ChromaDB
✓ No direct frontend access to LLM
✓ No unrestricted AI database access
✓ No cross-company retrieval
```

---

# 53. RAG Data Ownership

Primary database:

```text
Document metadata
Company ownership
Uploader
Processing status
File information
```

ChromaDB:

```text
Chunks
Embeddings
Retrieval metadata
```

File storage:

```text
Original uploaded document
```

LLM:

```text
Temporary request context
```

The LLM should not be treated as permanent storage for company knowledge.

---

# 54. Complete RAG Ingestion Architecture

```text
                         ADMIN
                           │
                           ▼
                      React UI
                           │
                           ▼
                   POST /documents
                           │
                           ▼
                    Express API
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
            File Storage       Document DB
                  │                 │
                  └────────┬────────┘
                           ▼
                    Ingestion Service
                           │
                           ▼
                     PDF Extraction
                           │
                           ▼
                       Cleaning
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
                         INDEXED
```

---

# 55. Complete RAG Query Architecture

```text
                         CUSTOMER
                            │
                            ▼
                        React Chat
                            │
                            ▼
                      POST /chat
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
                            ▼
                        RAG Agent
                            │
                     ┌──────┴──────┐
                     ▼             ▼
              Query Embedding   History
                     │             │
                     ▼             │
                  ChromaDB         │
                     │             │
                     ▼             │
               Relevant Chunks     │
                     │             │
                     └──────┬──────┘
                            ▼
                     Context Builder
                            │
                            ▼
                         Prompt
                            │
                            ▼
                           LLM
                            │
                            ▼
                      AI Response
                       │        │
                       │        └────────► Sources
                       │
                       ▼
                  CRM Intelligence
                       │
                       ▼
                  Structured Intent
                       │
                       ▼
                  Backend Validation
                       │
                       ▼
                     CRM Service
```

---

# 56. RAG Module Structure

Final conceptual structure:

```text
server/src/rag/
│
├── loaders/
│   └── pdf.loader.js
│
├── processors/
│   └── text-cleaner.js
│
├── chunkers/
│   └── document-chunker.js
│
├── embeddings/
│   └── huggingface.embeddings.js
│
├── vectorstore/
│   └── chroma.client.js
│
├── retrievers/
│   └── company.retriever.js
│
├── prompts/
│   ├── system.prompt.js
│   ├── rag.prompt.js
│   └── sales.prompt.js
│
├── chains/
│   └── rag.chain.js
│
├── agent/
│   └── sales.agent.js
│
├── services/
│   ├── ingestion.service.js
│   ├── retrieval.service.js
│   └── generation.service.js
│
└── rag.service.js
```

---

# 57. RAG Development Sequence

The RAG implementation should follow:

```text
Step 1
PDF Loader
    ↓
Step 2
Text Extraction
    ↓
Step 3
Text Cleaning
    ↓
Step 4
Chunking
    ↓
Step 5
Embedding Model
    ↓
Step 6
ChromaDB
    ↓
Step 7
Similarity Retrieval
    ↓
Step 8
Context Builder
    ↓
Step 9
Prompt
    ↓
Step 10
LLM
    ↓
Step 11
Source References
    ↓
Step 12
RAG API
    ↓
Step 13
Chat Integration
    ↓
Step 14
CRM Integration
```

---

# 58. RAG Configuration

The following configuration should be environment-driven where appropriate:

```text
CHROMA_URL=
CHROMA_COLLECTION=
HF_API_KEY=

LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=

CHUNK_SIZE=
CHUNK_OVERLAP=

TOP_K=
SIMILARITY_THRESHOLD=
```

Actual variables depend on the final provider and deployment architecture.

---

# 59. RAG Architectural Rules

### Rule 1 — ChromaDB Is the Vector Database

Do not use ChromaDB as the primary CRM database.

### Rule 2 — Backend Is the Gateway

The frontend communicates with RAG through Express.

### Rule 3 — Documents Are Processed Before Retrieval

Raw PDFs should not be sent directly to the LLM.

### Rule 4 — Retrieval Is Company-Aware

Every retrieval operation must respect tenant isolation.

### Rule 5 — Metadata Must Be Preserved

Document, page, chunk, and company information should survive the ingestion pipeline.

### Rule 6 — LLM Must Be Grounded

Company-specific answers should be based on retrieved company knowledge.

### Rule 7 — AI Does Not Directly Modify CRM

AI output must pass through backend validation.

### Rule 8 — RAG Quality Must Be Measured

Retrieval and generation quality must be evaluated before production.

---

# 60. Phase 0 RAG Decisions

Before Phase 1/AI implementation, the following must be finalized:

```text
✓ RAG runs inside Express or separate service
✓ LLM provider
✓ LLM model
✓ Embedding model
✓ ChromaDB deployment
✓ Collection strategy
✓ Chunking strategy
✓ Chunk size
✓ Chunk overlap
✓ Top-K retrieval
✓ Similarity threshold
✓ Prompt structure
✓ Conversation history strategy
✓ Source reference structure
✓ Tenant filtering strategy
✓ Document processing states
✓ RAG error handling
```

The README specifically identifies the decision of whether RAG runs inside Express or as a separate service/module as a Phase 0 architectural decision.

---

# 61. RAG Definition of Done

The RAG architecture is considered complete when:

```text
Company PDF
     │
     ▼
Upload
     │
     ▼
Text Extraction
     │
     ▼
Cleaning
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
User Question
     │
     ▼
Question Embedding
     │
     ▼
Company-filtered Retrieval
     │
     ▼
Relevant Context
     │
     ▼
Prompt
     │
     ▼
LLM
     │
     ▼
Grounded Answer
     │
     ▼
Source References
```

And the system can independently answer questions from an uploaded company PDF through an API.

This matches the project's stated RAG completion criterion: a standalone API should be able to answer questions based on an uploaded company PDF.

---

# 62. Final RAG Architecture

```text
                  ┌─────────────────────────┐
                  │      COMPANY DATA       │
                  │                         │
                  │ PDFs / Product / FAQs   │
                  └────────────┬────────────┘
                               │
                               ▼
                       ┌───────────────┐
                       │   INGESTION   │
                       └───────┬───────┘
                               │
                  ┌────────────┼────────────┐
                  ▼            ▼            ▼
              Extract       Clean        Metadata
                  │            │            │
                  └────────────┼────────────┘
                               ▼
                           Chunking
                               │
                               ▼
                         Embeddings
                               │
                               ▼
                         ┌──────────┐
                         │ ChromaDB │
                         └────┬─────┘
                              │
                              │
                       QUERY PIPELINE
                              │
                              ▼
                       User Question
                              │
                              ▼
                       Query Embedding
                              │
                              ▼
                     Tenant-aware Search
                              │
                              ▼
                       Relevant Chunks
                              │
                              ▼
                        Context Builder
                              │
                              ▼
                           Prompt
                              │
                              ▼
                             LLM
                              │
                              ▼
                       Grounded Answer
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                Customer            CRM Intent
                                        │
                                        ▼
                                  Backend Validation
                                        │
                                        ▼
                                   CRM Service
```

The RAG system is therefore an independent knowledge and reasoning layer, while **Express remains the security, authorization, orchestration, and business-logic gateway** for the overall product.
