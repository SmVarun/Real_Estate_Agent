Document Ingestion Architecture

1. Overview

The document ingestion system is responsible for converting company and
product knowledge into data that can be retrieved by the RAG agent.

The ingestion pipeline must not pass uploaded files directly to the LLM.

The required flow is:

Upload
  ↓
Store Original Document
  ↓
Extract Text
  ↓
Clean Text
  ↓
Split Into Chunks
  ↓
Generate Embeddings
  ↓
Store Vectors in ChromaDB
  ↓
Store Document Metadata

The ingestion layer is therefore the bridge between the company's
knowledge base and the RAG retrieval system.

The primary application database stores document metadata and
CRM-related information, while ChromaDB stores the vector
representations required for semantic retrieval.

2. Goals

The ingestion system should:

Accept company and product documents.

Store the original document safely.

Extract usable text from supported documents.

Clean and normalize extracted text.

Split documents into meaningful chunks.

Generate embeddings for each chunk.

Store embeddings in ChromaDB.

Store document and ingestion metadata in the primary database.

Track ingestion status.

Associate every document with the correct company/tenant.

Provide enough metadata to trace retrieved chunks back to their
source document.

3. MVP Scope

The initial MVP should support:

PDF upload.

PDF text extraction.

Text cleaning.

Chunking.

Embedding generation.

ChromaDB vector storage.

Document metadata storage.

Ingestion status tracking.

Future ingestion support can include:

DOCX

TXT

Web pages

Knowledge-base URLs

JSON

CSV

The uploaded file should first be processed by the ingestion pipeline
before becoming part of the RAG knowledge base.

4. High-Level Architecture

                    COMPANY ADMIN
                         │
                         ▼
                  Document Upload
                         │
                         ▼
                Express API Server
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       Original File            Document Record
          Storage              Primary Database
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
       Vector Knowledge Base

The backend should control the ingestion workflow.

The frontend should not communicate directly with ChromaDB.

5. Document Lifecycle

A document should move through explicit ingestion states.

Recommended lifecycle:

UPLOADED
   ↓
PROCESSING
   ↓
EXTRACTED
   ↓
CHUNKED
   ↓
EMBEDDED
   ↓
INDEXED
   ↓
COMPLETED

If an error occurs:

PROCESSING
   ↓
FAILED

The system should retain the failure status and useful error metadata so
that the document can be investigated or reprocessed.

6. Upload Flow

The initial upload flow is:

Admin
  ↓
Select PDF
  ↓
POST /api/documents
  ↓
Authenticate Request
  ↓
Identify Company
  ↓
Validate File
  ↓
Store Original File
  ↓
Create Document Metadata Record
  ↓
Start Ingestion

The upload endpoint should validate:

Authentication.

User authorization.

Company/tenant ownership.

File type.

File size.

Required metadata.

The system should reject unsupported or invalid files before ingestion
begins.

7. Original File Storage

The original document should be stored separately from the vector
representation.

The system may use the configured file/object storage layer for original
files.

The document metadata record should retain information such as:

document_id
company_id
file_name
file_type
file_size
storage_path
uploaded_by
uploaded_at
status

The original file should remain available so that the source can be
inspected or reprocessed later.

8. Text Extraction

For the MVP, PDF is the primary supported format.

PDF
 ↓
PDF Parser
 ↓
Extracted Text

The extraction layer should preserve useful source information where
available, especially:

Page number

Document identity

Source file

Extracted text

Page information is valuable because it allows retrieved content to be
traced back to the original document.

Example:

Document:
company-product-guide.pdf

Page:
12

Extracted text:
Product X provides ...

If text extraction fails, the document should be marked as FAILED.

9. Text Cleaning

Extracted text should be normalized before chunking.

The cleaning stage may handle:

Excessive whitespace.

Repeated line breaks.

Empty sections.

Unnecessary formatting artifacts.

Broken text caused by PDF extraction.

The goal is not to remove meaningful information.

Raw Extracted Text
        ↓
Cleaning
        ↓
Normalized Text
        ↓
Chunking

The cleaned text should remain associated with its source document and
page information.

10. Document Object

Before chunking, the extracted information should be represented
internally as a document object.

Conceptually:

Document
├── document_id
├── company_id
├── source
├── file_name
├── page_number
└── content

This object becomes the input to the chunking stage.

11. Chunking

Documents should be divided into meaningful chunks before embedding.

Company PDF
     ↓
Text Extraction
     ↓
Cleaning
     ↓
Chunking
     ↓
┌─────────┬─────────┬─────────┬─────────┐
│ Chunk 1 │ Chunk 2 │ Chunk 3 │ Chunk 4 │
└─────────┴─────────┴─────────┴─────────┘

Chunk size and overlap should be tested rather than blindly fixed.

The chunking strategy should preserve semantic meaning as much as
possible.

Avoid creating chunks that are so small that they lose context or so
large that retrieval becomes unnecessarily broad.

12. Chunk Metadata

Every chunk should carry metadata that allows it to be traced to its
source.

Recommended metadata:

document_id
company_id
document_type
page_number
source
chunk_id

Additional metadata can be introduced as the system evolves.

Example:

{
  "document_id": "doc_123",
  "company_id": "company_001",
  "document_type": "product",
  "page_number": 12,
  "source": "company-product-guide.pdf",
  "chunk_id": "doc_123_chunk_004"
}

This metadata is important for both retrieval filtering and source
references in AI responses.

13. Embedding Generation

Each chunk is converted into an embedding.

Text Chunk
    ↓
Hugging Face Embedding Model
    ↓
Vector

The embedding model should be applied consistently during ingestion and
retrieval.

The embedding process should generate one vector representation for each
chunk.

Conceptually:

Chunk 1 → Vector 1
Chunk 2 → Vector 2
Chunk 3 → Vector 3
Chunk 4 → Vector 4

14. ChromaDB Storage

The generated embeddings should be stored in ChromaDB.

ChromaDB is the vector database for the RAG system.

It should not be used as the primary CRM database.

Each vector record should contain:

ID
Embedding
Document/Chunk Content
Metadata

Example conceptual record:

{
  "id": "doc_123_chunk_004",
  "document": "Product X supports automated reporting...",
  "metadata": {
    "document_id": "doc_123",
    "company_id": "company_001",
    "document_type": "product",
    "page_number": 12,
    "source": "company-product-guide.pdf",
    "chunk_id": "doc_123_chunk_004"
  }
}

15. Multi-Tenant Isolation

Company isolation must be designed into ingestion from the beginning.

Every document and vector must be associated with the correct company.

Example:

Company A
├── Documents
├── Chunks
└── Vectors

Company B
├── Documents
├── Chunks
└── Vectors

A query belonging to Company A must never retrieve Company B's
knowledge.

The company_id should therefore be part of the document metadata and
vector metadata.

Retrieval must enforce tenant filtering at the backend/RAG layer rather
than relying only on frontend restrictions.

16. Ingestion Pipeline

The complete ingestion pipeline is:

                PDF Upload
                    │
                    ▼
             File Validation
                    │
                    ▼
           Store Original File
                    │
                    ▼
          Create Document Record
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
          Generate Embeddings
                    │
                    ▼
              ChromaDB
                    │
                    ▼
          Update Document Status
                    │
                    ▼
               COMPLETED

17. Error Handling

Each stage should be able to fail independently.

Potential failures include:

Invalid file.

Unsupported file type.

File too large.

Storage failure.

PDF extraction failure.

Empty extracted text.

Chunking failure.

Embedding model failure.

ChromaDB connection failure.

Database update failure.

A failed ingestion should not silently appear as a successfully indexed
document.

Example:

Upload
  ↓
Processing
  ↓
Extraction Failed
  ↓
FAILED

The document record should retain an error message or error code where
appropriate.

18. Reprocessing

Documents should be designed so that failed or outdated documents can be
reprocessed.

Conceptual flow:

Existing Document
      ↓
Reprocess
      ↓
Extract
      ↓
Clean
      ↓
Chunk
      ↓
Embed
      ↓
Replace/Update Vectors
      ↓
COMPLETED

When a document is reprocessed, the system must avoid leaving stale
vectors that could cause old information to be retrieved.

19. Document Deletion

Deleting a document should remove its associated knowledge from the RAG
system.

Conceptually:

Delete Document
      │
      ├── Delete Original File
      │
      ├── Delete Document Metadata
      │
      └── Delete Associated ChromaDB Vectors

Deletion must be scoped by company_id and document_id.

20. Recommended Backend Structure

A conceptual backend structure:

src/
├── modules/
│   └── ingestion/
│       ├── ingestion.controller.js
│       ├── ingestion.service.js
│       ├── ingestion.routes.js
│       ├── ingestion.validator.js
│       ├── extraction/
│       │   └── pdf.extractor.js
│       ├── chunking/
│       │   └── chunker.js
│       ├── embeddings/
│       │   └── embedding.service.js
│       └── vector/
│           └── chroma.service.js
│
├── models/
│   └── document.model.js
│
└── middleware/
    ├── auth.middleware.js
    └── upload.middleware.js

The exact folder structure can be refined during implementation.

21. Document Metadata Model

The primary database should contain a document record similar to:

Document
├── id
├── company_id
├── file_name
├── file_type
├── file_size
├── storage_path
├── document_type
├── status
├── uploaded_by
├── uploaded_at
├── processed_at
├── chunk_count
└── error_message

The model should be extended only when the implementation requires
additional metadata.

22. API Responsibilities

The ingestion API should provide the application with operations such
as:

POST   /api/documents
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/:id/reprocess

The exact API specification belongs to the API design document.

The ingestion API should enforce authentication and company-level
authorization.

23. Security Requirements

The ingestion system handles company-owned documents and must therefore
enforce:

JWT authentication.

Authorization.

Tenant isolation.

File type validation.

File size limits.

Secure storage.

Safe file naming.

Input validation.

Protected document APIs.

Controlled access to original files.

Controlled access to ingestion operations.

Uploaded files should never be trusted solely because they originate
from an authenticated user.

24. Observability

The ingestion pipeline should expose enough information to diagnose
failures.

Track:

document_id
company_id
ingestion_status
processing_time
chunk_count
embedding status
vector storage status
error information

Useful operational events include:

DOCUMENT_UPLOADED
INGESTION_STARTED
TEXT_EXTRACTED
DOCUMENT_CHUNKED
EMBEDDINGS_GENERATED
DOCUMENT_INDEXED
INGESTION_COMPLETED
INGESTION_FAILED

25. RAG Integration

Once ingestion is complete, the knowledge becomes available to the RAG
retrieval pipeline.

The relationship is:

                INGESTION
                    │
                    ▼
             ChromaDB Vectors
                    │
                    ▼
                RETRIEVAL
                    │
                    ▼
             Relevant Chunks
                    │
                    ▼
                   LLM
                    │
                    ▼
              Final Answer

The ingestion layer therefore prepares the knowledge base, while the
retrieval layer selects relevant knowledge at query time.

26. MVP Completion Criteria

The ingestion phase is complete when:

A company administrator can upload a PDF.

The backend validates the upload.

The original document is stored.

Document metadata is persisted.

PDF text can be extracted.

Extracted text can be cleaned.

Documents can be split into chunks.

Embeddings can be generated.

Embeddings can be stored in ChromaDB.

Chunk metadata contains the correct company/document information.

Ingestion status is tracked.

Failed ingestion is reported.

Documents can be traced back to their original source.

Company A cannot create vectors that are retrieved by Company B.

A successfully indexed document can be retrieved by the RAG
pipeline.

27. Final Ingestion Principle

The ingestion system should transform raw company knowledge into a
structured, searchable knowledge base:

Raw Company Data
       ↓
Document
       ↓
Extracted Text
       ↓
Clean Text
       ↓
Meaningful Chunks
       ↓
Embeddings
       ↓
ChromaDB
       ↓
Retrievable Company Knowledge

The core principle is:

Store the original document separately, store business metadata in
the primary database, and store embeddings/chunks in ChromaDB with
strong company-aware metadata.