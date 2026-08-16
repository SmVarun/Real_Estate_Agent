Chat Architecture

1. Overview

The chat system is the first user-facing communication layer for
interacting with the AI Sales CRM and RAG agent.

For the MVP, the platform should use an internal web chat interface
before implementing WhatsApp or other external messaging channels.

The chat system is responsible for:

Conversation creation.

Conversation listing.

Message persistence.

Sending user messages to the backend.

Communicating with the RAG agent through the backend.

Displaying AI responses.

Displaying source references.

Tracking message timestamps.

Handling loading and error states.

Linking conversations with CRM leads where applicable.

The backend remains the gateway between the chat interface, CRM, RAG
system, and future messaging channels.

2. Chat Goals

The MVP chat should allow a user to:

Start a new conversation.

View existing conversations.

Send messages.

Receive AI responses.

View message history.

See source references used by the RAG system.

See message timestamps.

Handle loading states.

Handle errors.

Associate conversations with CRM leads where appropriate.

The chat should work with the RAG Agent API rather than communicating
directly with the LLM or ChromaDB.

3. MVP Principle

The internal chat should be implemented before WhatsApp integration.

The recommended sequence is:

RAG Pipeline
    ↓
RAG Agent API
    ↓
Internal Chat
    ↓
CRM + AI Integration
    ↓
WhatsApp

This allows the complete AI workflow to be tested without introducing
external messaging API dependencies.

4. High-Level Architecture

                         React Chat UI
                               │
                               │ REST
                               ▼
                      Node.js / Express
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
              Chat Service          RAG Agent
                     │                   │
                     ▼                   ▼
             Primary Database        ChromaDB
                     │                   │
                     │                  LLM
                     │                   │
                     └─────────┬─────────┘
                               │
                               ▼
                         AI Response
                               │
                               ▼
                         React Chat UI

The frontend should never directly communicate with ChromaDB or the LLM.

5. Chat Components

The MVP chat consists of:

Chat
├── Conversation List
├── New Conversation
├── Conversation View
├── Message List
├── Message Composer
├── AI Response
├── Source References
├── Loading State
└── Error State

6. Conversation

A conversation represents a logical interaction between a customer/user
and the AI agent.

Conceptually:

Conversation
├── id
├── company_id
├── user/customer
├── lead_id
├── channel
├── title
├── status
├── created_at
└── updated_at

The exact model should be finalized in database.md.

6.1 Conversation Channel

The internal MVP should use:

INTERNAL_CHAT

Future channels can include:

WHATSAPP
WEBSITE
OTHER

The channel field allows the same conversation architecture to support
multiple communication channels later.

7. Conversation Lifecycle

A basic conversation flow is:

New Conversation
       ↓
ACTIVE
       ↓
Messages exchanged
       ↓
Conversation updated
       ↓
COMPLETED / ARCHIVED

The exact status model can be refined during implementation.

8. Creating a Conversation

The user should be able to create a new conversation from the chat
interface.

Flow:

User
 ↓
New Conversation
 ↓
React UI
 ↓
POST /api/conversations
 ↓
Authentication
 ↓
Identify Company/User
 ↓
Create Conversation
 ↓
Return conversationId
 ↓
Open Chat

The backend must associate the conversation with the correct
company/tenant.

9. Sending a Message

The initial request/response flow should use REST.

User
 ↓
Types Message
 ↓
Send
 ↓
POST /api/chat
 ↓
Authentication
 ↓
Identify Conversation
 ↓
Persist User Message
 ↓
Send Question to RAG Agent
 ↓
Retrieve Context
 ↓
Generate AI Response
 ↓
Persist AI Message
 ↓
Return Response
 ↓
Chat UI

This keeps the MVP architecture simple.

10. Chat API

The primary chat endpoint should follow the project specification:

POST /api/chat

Request:

{
  "conversationId": "conversation_123",
  "message": "What are the features of Product X?"
}

The backend should:

Request
 ↓
Authentication
 ↓
Identify company/user
 ↓
Validate conversation
 ↓
Persist user message
 ↓
Send question to RAG
 ↓
Retrieve relevant context
 ↓
Generate answer
 ↓
Persist AI response
 ↓
Return response

11. Chat Response

The response should ideally contain:

{
  "answer": "Product X provides ...",
  "conversationId": "conversation_123",
  "sources": [],
  "confidence": {},
  "metadata": {}
}

The exact response structure can be refined during API implementation.

12. Message Model

A message should conceptually contain:

Message
├── id
├── conversation_id
├── company_id
├── sender_type
├── content
├── sources
├── metadata
├── created_at
└── updated_at

Possible sender types:

USER
AI
SYSTEM

The exact model should be defined in database.md.

13. User Message Flow

User Message
     ↓
Validate Request
     ↓
Validate Conversation
     ↓
Persist Message
     ↓
RAG Agent

The user message should be persisted before or as part of the AI
processing flow so that the conversation history remains consistent.

14. AI Message Flow

RAG Agent
    ↓
Generate Answer
    ↓
Attach Sources
    ↓
Persist AI Message
    ↓
Return Response

AI responses should be stored as part of the conversation history.

15. Message History

The chat UI should display messages in chronological order.

Example:

Customer:
What are the features of Product X?

AI:
Product X provides automated reporting,
real-time monitoring, and ...

Customer:
Does it support exports?

AI:
Yes. According to the company documentation...

The backend should provide an API for loading conversation history.

Example:

GET /api/conversations/:id/messages

Pagination should be considered as conversation history grows.

16. Conversation List

The chat interface should provide a conversation list.

Example:

Conversations

Product Inquiry
Today

Pricing Discussion
Yesterday

Product Comparison
Aug 14

The conversation list can initially use a generated title or a simple
user-provided title.

Advanced AI-generated conversation titles can be added later.

17. New Conversation

The user should be able to create a new conversation without manually
entering unnecessary technical information.

New Conversation
       ↓
Backend creates conversation
       ↓
Conversation ID returned
       ↓
Chat screen opens

18. Source References

The chat interface should expose source information returned by the RAG
system.

Example:

AI Answer

Product X supports automated reporting.

Sources:
- product-guide.pdf — Page 12
- pricing-guide.pdf — Page 4

Sources should be generated from the metadata stored during ingestion.

Relevant source metadata may include:

document_id
source
page_number
chunk_id
document_type

This improves transparency and allows users to understand where an
answer originated.

19. RAG Integration

The chat system should not implement document retrieval itself.

The relationship should be:

Chat
 ↓
Express API
 ↓
RAG Agent
 ↓
Question Embedding
 ↓
ChromaDB Retrieval
 ↓
Relevant Chunks
 ↓
LLM
 ↓
AI Answer
 ↓
Chat

The chat layer is responsible for communication and presentation.

The RAG layer is responsible for knowledge retrieval and generation.

20. Conversation Context

The RAG agent should receive enough conversation context to answer
follow-up questions where required.

Example:

User:
What are the features of Product X?

AI:
Product X provides automated reporting.

User:
Does it support exports?

AI:
Yes, Product X supports exports.

The exact conversation-history strategy should be finalized during RAG
Agent API implementation.

The chat system should persist conversation history so that context is
not lost.

21. Loading State

The UI should clearly indicate that the AI is processing a request.

Example:

User:
Tell me about Product X.

AI:
Thinking...

The loading state should begin after the message is submitted and end
when a response or error is received.

22. Error State

The chat UI should handle failures gracefully.

Potential errors:

Authentication Failure
Conversation Not Found
Invalid Message
RAG Failure
LLM Failure
Database Failure
Network Failure
Rate Limit

Example:

Unable to generate a response.
Please try again.

Technical error details should not be exposed unnecessarily to end
users.

23. Retry

A failed AI response may support retry.

Conceptually:

AI Request
   ↓
Failure
   ↓
Retry
   ↓
RAG Agent

Retry behavior should avoid creating duplicate user messages or
inconsistent conversation records.

24. Real-Time Communication

REST is sufficient for the first request/response MVP.

Socket.IO should only be introduced where real-time behavior provides
clear value.

Possible future uses:

Message status
Streaming-like UI updates
Agent processing state
Live CRM updates
Notifications

Do not introduce Socket.IO into every chat operation simply because it
is available.

25. Streaming

A streaming-like response can be added later.

Future flow:

User Message
     ↓
RAG Agent
     ↓
LLM
     ↓
Partial Response
     ↓
Socket.IO / Streaming Transport
     ↓
Chat UI

For the initial MVP:

Request
  ↓
Complete AI Response
  ↓
UI

This keeps implementation complexity low.

26. CRM Integration

A conversation may become associated with a CRM lead.

Conceptually:

Conversation
      ↓
Customer identified
      ↓
Lead exists?
   ┌──┴──┐
  Yes    No
   │      │
   │      ▼
   │   Create Lead
   │      │
   └──┬───┘
      ▼
   Link Lead

The AI system may detect lead information, but the CRM service must
perform the actual database mutation after backend validation.

27. AI Lead Detection from Chat

The chat can produce CRM signals such as:

Purchase intent
Pricing inquiry
Product inquiry
Callback request
Request for salesperson
High interest
Objection
Follow-up requirement

Example:

Customer:
"I want to buy this product.
Can someone contact me?"

        ↓

AI

Intent = PURCHASE
Interest = HIGH
Callback = REQUIRED

        ↓

CRM Service

Lead Created / Updated

The LLM must not directly write to the CRM database.

28. Multi-Tenant Chat Isolation

Every conversation and message should belong to a company/tenant.

Example:

Company A
├── Conversation A1
├── Conversation A2
└── Messages

Company B
├── Conversation B1
└── Messages

A user from Company A must not be able to retrieve:

Company B conversations
Company B messages
Company B lead information
Company B RAG context

The backend must enforce tenant isolation.

29. Chat Authorization

Before accessing a conversation:

Request
 ↓
JWT Verification
 ↓
User Identification
 ↓
Company Membership
 ↓
Conversation Ownership / Access
 ↓
Permission Check
 ↓
Allow / Deny

Authorization must be performed server-side.

30. Chat API Structure

Conceptual endpoints:

POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
DELETE /api/conversations/:id

GET    /api/conversations/:id/messages

POST   /api/chat

Future endpoints may include:

PATCH  /api/conversations/:id
POST   /api/conversations/:id/archive
POST   /api/conversations/:id/retry

The final API contract should be defined in api.md.

31. Frontend Structure

A conceptual React structure:

src/
├── features/
│   └── chat/
│       ├── components/
│       │   ├── ConversationList.jsx
│       │   ├── ConversationItem.jsx
│       │   ├── MessageList.jsx
│       │   ├── MessageBubble.jsx
│       │   ├── MessageComposer.jsx
│       │   ├── SourceReferences.jsx
│       │   └── TypingIndicator.jsx
│       │
│       ├── pages/
│       │   └── ChatPage.jsx
│       │
│       ├── chat.api.js
│       └── chat.state.js

The exact frontend architecture can be refined during implementation.

32. Backend Structure

A conceptual backend structure:

src/
├── modules/
│   └── chat/
│       ├── chat.controller.js
│       ├── chat.service.js
│       ├── chat.repository.js
│       ├── chat.validator.js
│       └── chat.routes.js
│
├── modules/
│   └── conversations/
│       ├── conversation.controller.js
│       ├── conversation.service.js
│       └── conversation.routes.js
│
└── middleware/
    ├── auth.middleware.js
    └── authorization.middleware.js

The chat service should communicate with the RAG Agent through a defined
service interface.

33. Chat Service Flow

Recommended backend service flow:

chat.controller
       ↓
chat.service
       ↓
Validate conversation
       ↓
Save user message
       ↓
RAG Agent
       ↓
Receive answer + sources
       ↓
Save AI message
       ↓
Return response

This keeps controller logic thin and business logic centralized.

34. RAG Service Interface

The chat layer should interact with the RAG system through a predictable
interface.

Conceptually:

RAGService.ask({
    companyId,
    conversationId,
    message
})

Response:

{
    answer,
    sources,
    metadata
}

The exact implementation can be changed later without requiring major
changes to the chat UI.

35. Persistence Rules

The system should persist:

Conversation
+
User Messages
+
AI Messages
+
Source References
+
Relevant Metadata

Persisting chat history is important for:

Conversation continuity.

CRM intelligence.

Future analytics.

Customer support.

AI context.

Auditing.

36. Message Ordering

Messages should have reliable timestamps and identifiers.

The UI should render messages in chronological order.

The backend should avoid relying only on client timestamps.

Recommended fields:

created_at
updated_at

The server should generate authoritative timestamps.

37. Chat Security

The chat system should implement:

JWT authentication.

Company/tenant isolation.

Conversation authorization.

Input validation.

Rate limiting.

Secure error handling.

Message size limits.

Protected APIs.

Secure environment variables.

User-provided message content should be treated as untrusted input.

38. Chat Observability

Useful events to track include:

CONVERSATION_CREATED
MESSAGE_SENT
RAG_REQUEST_STARTED
RAG_REQUEST_COMPLETED
AI_RESPONSE_CREATED
RAG_REQUEST_FAILED
MESSAGE_PERSIST_FAILED
CONVERSATION_ARCHIVED

Useful metrics include:

Chat latency
RAG latency
LLM latency
Message count
RAG failures
LLM failures
Database failures
Token/API usage

39. Performance Considerations

The MVP should prioritize a simple request/response flow.

Important considerations:

Avoid loading entire conversation histories unnecessarily.

Paginate older messages.

Keep database queries indexed.

Avoid unnecessary RAG calls.

Use appropriate request timeouts.

Apply rate limiting.

Avoid duplicate message submissions.

Future optimization can introduce caching or streaming where justified.

40. MVP Chat Flow

The complete MVP flow is:

                 USER
                   │
                   ▼
             React Chat UI
                   │
                   ▼
             Express API
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
     Save Message       RAG Agent
                              │
                              ▼
                         ChromaDB
                              │
                              ▼
                             LLM
                              │
                              ▼
                         AI Answer
                              │
          ┌───────────────────┘
          ▼
     Save AI Message
          │
          ▼
     Return Response
          │
          ▼
      React Chat UI

41. Future WhatsApp Architecture

After the internal chat workflow is stable, WhatsApp can become another
channel using the same backend services.

Customer
   ↓
WhatsApp
   ↓
WhatsApp Business API
   ↓
Webhook
   ↓
Express Backend
   ↓
Conversation Service
   ↓
RAG Agent
   ↓
AI Response
   ↓
WhatsApp API
   ↓
Customer

The same conversation and CRM architecture should be reused rather than
creating a completely separate AI system for WhatsApp.

42. Channel Abstraction

The chat architecture should make channel expansion possible.

Conceptually:

                 Conversation Service
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    Internal Chat     WhatsApp       Website
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                      RAG Agent
                         │
                         ▼
                        CRM

The RAG and CRM layers should remain independent of the communication
channel.

43. MVP Completion Criteria

The chat phase is complete when:

A user can create a conversation.

Conversations can be listed.

A conversation can be opened.

Messages can be sent.

User messages are persisted.

Messages are passed to the RAG Agent.

AI responses are returned.

AI responses are persisted.

Source references are displayed.

Message timestamps are displayed.

Loading states work.

Error states work.

Conversation history can be loaded.

Conversations are associated with the correct company.

Unauthorized users cannot access another company's conversations.

The chat works without WhatsApp integration.

REST is sufficient for the initial request/response flow.

44. Post-MVP Chat Features

Keep these for later:

Streaming responses
Socket.IO real-time updates
Typing indicators
Message delivery status
AI-generated conversation titles
Conversation search
Conversation tagging
Conversation assignment
Human handoff
Agent takeover
Advanced conversation analytics
WhatsApp
Multiple messaging channels

45. Final Chat Principle

The internal chat is not the RAG system itself.

It is the communication interface connecting the user to the backend and
RAG agent.

                    CHAT
                      │
                      ▼
                  EXPRESS
                      │
              ┌───────┴───────┐
              ▼               ▼
         Conversation       RAG Agent
            Service             │
              │                 ▼
              ▼              ChromaDB
          Database               │
                                ▼
                               LLM
                                │
                                ▼
                            AI Response
                                │
              ┌─────────────────┘
              ▼
             CRM

The key architectural principle is:

Build the internal chat first, keep REST as the initial
communication mechanism, persist conversations and messages, expose
RAG sources, and keep the communication layer independent from the RAG
and CRM business logic.