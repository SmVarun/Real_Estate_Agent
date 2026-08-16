CRM Architecture

1. Overview

The CRM is the central business management layer of the AI Sales CRM
platform.

It manages:

Users and company access.

Salespeople.

Leads.

Lead assignments.

Lead lifecycle and status.

Customer interactions.

Company/product business information.

CRM activity required by the AI layer.

The CRM must remain independent from the RAG vector database.

The primary application database stores CRM entities and business data,
while ChromaDB is reserved for vector storage and retrieval.

2. CRM Goals

The CRM should allow a company administrator to:

Manage salespeople.

Create and manage leads.

Assign leads to salespeople.

Track lead status.

Track lead interest.

View recent activity.

Monitor lead distribution.

Identify high-interest leads.

Connect conversations with leads.

Provide CRM context to the AI system.

The CRM should work independently before AI integration.

3. High-Level Architecture

                         React CRM Dashboard
                                  │
                                  │ REST API
                                  ▼
                         Node.js / Express
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
          Authentication      CRM Service      AI/RAG Layer
                 │                │                │
                 │                ▼                │
                 │          Primary Database      │
                 │                │                │
                 └────────────────┴────────────────┘
                                  │
                                  ▼
                         CRM Business Data

The frontend must communicate with the CRM through the backend.

The frontend should not directly access the database.

4. CRM Modules

The MVP CRM should contain the following modules:

CRM
├── Dashboard
├── Salespersons
├── Leads
├── Lead Assignments
├── Lead Activity
├── Conversations
└── Company/Product Information

Some modules may initially share backend services but should remain
logically separated.

5. User Roles

The platform should support role-based access.

Initial roles:

ADMIN
SALESPERSON

Admin

An administrator can:

Manage salespeople.

Manage leads.

Assign leads.

Change lead status.

View dashboard analytics.

Manage company information.

Upload company documents.

Access CRM and knowledge-management functionality.

Salesperson

A salesperson can:

View assigned leads.

View lead information.

Update permitted lead fields.

Add notes.

Track follow-ups.

View relevant conversations.

Exact permissions should be enforced through backend authorization.

6. Company / Tenant

The CRM should be designed for multi-company usage from the beginning.

Conceptually:

Company A
├── Users
├── Salespersons
├── Leads
├── Conversations
└── Documents

Company B
├── Users
├── Salespersons
├── Leads
├── Conversations
└── Documents

Every CRM entity that belongs to a company should contain a
company/tenant identifier.

Example:

company_id

All backend queries must enforce company-level isolation.

A user belonging to Company A must never access Company B's CRM data.

7. Salesperson Management

7.1 Salesperson Information

The CRM should store:

Salesperson
├── id
├── company_id
├── name
├── email
├── phone
├── role
├── status
├── assigned_leads
├── created_at
└── updated_at

Additional business metadata can be added later.

7.2 Salesperson Status

Recommended statuses:

ACTIVE
INACTIVE

An inactive salesperson should not receive new lead assignments.

Existing assignments may remain visible according to the company's
workflow.

7.3 Salesperson CRUD

The CRM should support:

Create salesperson
Get salesperson
List salespeople
Update salesperson
Deactivate salesperson

Deletion should be handled carefully because historical lead assignments
and activity may depend on the salesperson record.

Soft deletion/deactivation is preferable for business records.

8. Lead Management

8.1 Lead Overview

A lead represents a potential customer or business opportunity.

A lead should contain information such as:

Lead
├── id
├── company_id
├── name
├── email
├── phone
├── product_interest
├── interest_level
├── lead_source
├── assigned_salesperson_id
├── status
├── notes
├── last_interaction
├── created_at
└── updated_at

The exact fields can be expanded as the product evolves.

8.2 Lead Source

The CRM should record how a lead entered the system.

Possible sources include:

CHAT
WHATSAPP
WEBSITE
MANUAL
REFERRAL
OTHER

The source list can be extended later.

8.3 Lead Interest

The system should track customer interest.

Recommended initial values:

LOW
MEDIUM
HIGH

The AI layer can later determine interest based on conversation signals.

9. Lead Lifecycle

The recommended initial lead lifecycle is:

NEW
 ↓
CONTACTED
 ↓
INTERESTED
 ↓
HIGHLY_INTERESTED
 ↓
QUALIFIED
 ↓
CONVERTED

Alternative outcomes:

NOT_INTERESTED
LOST

The backend should validate status transitions rather than allowing
arbitrary status values from the frontend.

9.1 Lead Status Definitions

NEW

Lead has entered the CRM but has not yet been contacted.

CONTACTED

A salesperson or automated system has initiated contact.

INTERESTED

The customer has demonstrated meaningful interest.

HIGHLY_INTERESTED

The customer has demonstrated strong purchase intent or requested direct
sales interaction.

QUALIFIED

The lead satisfies the company's qualification criteria.

CONVERTED

The lead has completed the desired business conversion.

NOT_INTERESTED

The customer has explicitly indicated that they are not interested.

LOST

The opportunity could not be converted.

10. Lead Assignment

High-interest leads should be visible to the sales team.

Initial MVP assignment can be manual.

Flow:

Lead
 ↓
Interest increases
 ↓
CRM detects HIGH / HIGHLY_INTERESTED
 ↓
Assignment required
 ↓
Admin selects salesperson
 ↓
Lead assigned
 ↓
Salesperson notified

Automatic assignment can be introduced after the basic CRM workflow is
stable.

10.1 Assignment Data

An assignment should record:

Lead Assignment
├── id
├── company_id
├── lead_id
├── salesperson_id
├── assigned_by
├── assigned_at
└── status

Keeping assignment history allows the system to understand how a lead
moved between salespeople.

11. Lead Activity

The CRM should maintain an activity history for important lead events.

Examples:

LEAD_CREATED
LEAD_UPDATED
STATUS_CHANGED
INTEREST_CHANGED
ASSIGNED
REASSIGNED
NOTE_ADDED
MESSAGE_RECEIVED
MESSAGE_SENT
FOLLOW_UP_CREATED

Conceptually:

Lead
 │
 ├── Activity 1
 ├── Activity 2
 ├── Activity 3
 └── Activity 4

Activity history provides a timeline of the lead's journey.

12. Notes

Salespeople should be able to add notes to leads.

Example:

Lead:
Rahul

Note:
Customer requested a callback tomorrow afternoon.

Notes should contain:

note_id
lead_id
company_id
created_by
content
created_at
updated_at

Notes should be treated as company-owned CRM data.

13. Dashboard

The CRM dashboard should provide a high-level view of business activity.

Initial dashboard metrics:

Total Leads
New Leads
Interested Leads
Highly Interested Leads
Converted Leads
Salesperson Count
Assigned Leads
Unassigned Leads
Recent Activity
Lead Distribution

13.1 Dashboard Flow

React Dashboard
      ↓
GET /api/dashboard
      ↓
Authentication
      ↓
Company Identification
      ↓
CRM Aggregation
      ↓
Dashboard Metrics
      ↓
React UI

Dashboard queries should be optimized as the number of leads grows.

14. Lead Distribution

The dashboard should expose how leads are distributed across
salespeople.

Example:

Salesperson A → 20 leads
Salesperson B → 14 leads
Salesperson C → 8 leads
Unassigned    → 5 leads

This allows administrators to identify workload imbalance.

15. CRM and Conversations

A conversation should be linkable to a lead.

Conceptually:

Customer
   ↓
Conversation
   ↓
Lead
   ↓
Salesperson

A conversation may originate from:

INTERNAL_CHAT
WHATSAPP
WEBSITE
OTHER

The conversation itself should remain separate from the lead record
while maintaining a relationship to it.

16. CRM + AI Integration

The AI agent should not directly modify CRM database records.

The correct architecture is:

Customer
   ↓
AI Conversation
   ↓
RAG / AI Agent
   ↓
Structured Intent
   ↓
Backend Validation
   ↓
CRM Service
   ↓
Primary Database

The LLM should produce structured information or a tool request.

The backend validates the request before performing CRM mutations.

16.1 AI Lead Detection

The AI system can identify signals such as:

Product inquiry
Pricing inquiry
High purchase intent
Request for callback
Request for salesperson
Product comparison
Objection
Follow-up requirement

Example:

Customer:

"I want to buy this property.
Can someone contact me?"

        ↓

AI Analysis

Intent      = PURCHASE
Interest    = HIGH
Callback    = REQUIRED

        ↓

CRM Service

Create / Update Lead

17. AI-to-CRM Event

A conceptual structured event can look like:

{
  "event": "LEAD_UPDATE",
  "company_id": "company_001",
  "lead_id": "lead_123",
  "intent": "PURCHASE",
  "interest_level": "HIGH",
  "callback_required": true
}

The backend must validate:

Company ownership.

Lead ownership.

Allowed fields.

Allowed status transitions.

User/agent permissions.

Only after validation should the CRM service modify the database.

18. Lead Creation from AI

When an unknown customer interacts with the AI:

Customer
   ↓
Chat
   ↓
AI
   ↓
Lead information detected
   ↓
Backend validation
   ↓
Create Lead
   ↓
CRM

The system should avoid creating duplicate leads where possible.

A future deduplication strategy can use identifiers such as:

email
phone
external_customer_id

19. Lead Scoring

Advanced AI-based lead scoring should remain outside the initial MVP.

For the MVP, use explicit interest/status fields.

Future scoring can consider:

Conversation signals
+
Product interest
+
Pricing questions
+
Purchase intent
+
Callback requests
+
Customer engagement

The result could become a numerical or categorical lead score.

20. CRM API Structure

A conceptual API structure:

/api/
├── dashboard
├── salespersons
├── leads
├── lead-assignments
├── lead-activities
├── conversations
└── notes

Example endpoints:

GET    /api/dashboard

POST   /api/salespersons
GET    /api/salespersons
GET    /api/salespersons/:id
PATCH  /api/salespersons/:id

POST   /api/leads
GET    /api/leads
GET    /api/leads/:id
PATCH  /api/leads/:id
DELETE /api/leads/:id

POST   /api/leads/:id/assign
GET    /api/leads/:id/activity

POST   /api/leads/:id/notes
GET    /api/leads/:id/notes

The final API specification should define request validation, response
structures, pagination, filtering, sorting, and authorization.

21. Lead Filtering

The lead list should eventually support filters such as:

Status
Interest Level
Lead Source
Assigned Salesperson
Created Date
Updated Date
Product

Example:

GET /api/leads?status=HIGHLY_INTERESTED

All filtering must remain company-scoped.

22. Pagination

Lead and activity endpoints should use pagination rather than returning
unlimited records.

Conceptually:

GET /api/leads?page=1&limit=20

Response:

{
  "data": [],
  "page": 1,
  "limit": 20,
  "total": 100
}

The exact API response format should follow the project's global API
conventions.

23. Database Relationships

A simplified relationship structure:

Company
   │
   ├──────────── Users
   │
   ├──────────── Salespersons
   │                   │
   │                   └──── Leads
   │
   ├──────────── Leads
   │                   │
   │                   ├──── Activities
   │                   ├──── Notes
   │                   └──── Conversations
   │
   └──────────── Documents

The actual database schema should enforce the relationships through
identifiers and appropriate constraints.

24. Recommended CRM Data Models

The initial application database should contain logical models for:

Company
User
Salesperson
Lead
LeadAssignment
LeadActivity
LeadNote
Conversation
Message
Document

Some entities may share the same underlying user table.

The final database design should be defined in database.md.

25. Authorization

Every CRM endpoint should verify:

Authentication
      ↓
User Identity
      ↓
Company Membership
      ↓
Role Permission
      ↓
Resource Ownership
      ↓
CRM Operation

Example:

Salesperson A
      ↓
Requests Lead B
      ↓
Backend checks assignment
      ↓
Access granted/denied

Authorization must be enforced server-side.

26. Security

The CRM must implement:

JWT authentication.

Role-based authorization.

Company/tenant isolation.

Request validation.

Protected APIs.

Rate limiting where appropriate.

Secure error handling.

Audit/activity tracking.

Secure environment variables.

The frontend should never be considered a security boundary.

27. CRM Service Layer

Business logic should remain outside controllers where possible.

Recommended structure:

Controller
    ↓
Service
    ↓
Repository / Database

Example:

lead.controller.js
        ↓
lead.service.js
        ↓
lead.repository.js
        ↓
Primary Database

This makes the CRM easier to test and allows AI services to reuse the
same business logic.

28. Recommended Backend Structure

Conceptual structure:

src/
├── modules/
│   └── crm/
│       ├── dashboard/
│       │   ├── dashboard.controller.js
│       │   ├── dashboard.service.js
│       │   └── dashboard.routes.js
│       │
│       ├── leads/
│       │   ├── lead.controller.js
│       │   ├── lead.service.js
│       │   ├── lead.repository.js
│       │   ├── lead.validator.js
│       │   └── lead.routes.js
│       │
│       ├── salespersons/
│       │   ├── salesperson.controller.js
│       │   ├── salesperson.service.js
│       │   └── salesperson.routes.js
│       │
│       ├── assignments/
│       ├── activities/
│       ├── notes/
│       └── conversations/
│
└── middleware/
    ├── auth.middleware.js
    └── authorization.middleware.js

The exact structure can evolve during implementation.

29. CRM Workflow

The basic manual CRM workflow is:

Admin
  ↓
Creates / receives Lead
  ↓
Lead = NEW
  ↓
Salesperson contacts customer
  ↓
Lead = CONTACTED
  ↓
Customer shows interest
  ↓
Lead = INTERESTED
  ↓
Strong purchase intent
  ↓
Lead = HIGHLY_INTERESTED
  ↓
Salesperson assigned
  ↓
Lead = QUALIFIED
  ↓
Successful sale
  ↓
Lead = CONVERTED

Alternative:

Lead
 ↓
NOT_INTERESTED

or:

Lead
 ↓
LOST

30. MVP CRM Scope

The first production-like MVP should include:

Authentication
        +
Company/Tenant
        +
Salesperson Management
        +
Lead Management
        +
Lead Assignment
        +
Lead Status
        +
Interest Level
        +
Notes
        +
Basic Activity
        +
Dashboard Analytics
        +
Conversation/Lead Linking

The CRM should function completely without the AI system.

This provides a stable business foundation before CRM-AI integration.

31. Post-MVP CRM Features

The following should be considered later:

Automatic lead assignment
Advanced lead scoring
AI-based lead scoring
Advanced analytics
Sales forecasting
Pipeline visualization
Automated follow-ups
Email integration
Calendar integration
Advanced conversation intelligence
Multiple external messaging channels

These features should not delay the initial CRM MVP.

32. CRM Completion Criteria

The CRM phase is complete when:

An administrator can manage salespeople.

Salespeople can be created and managed.

Leads can be created.

Leads can be viewed.

Leads can be updated.

Leads can be assigned.

Lead status can be changed.

Interest level can be tracked.

Lead notes can be stored.

Lead activity can be tracked.

Dashboard metrics are available.

Leads can be filtered and paginated.

Conversations can be associated with leads.

Company/tenant isolation is enforced.

Role-based permissions work.

CRM APIs are authenticated and validated.

The CRM works independently of the RAG system.

33. Final CRM Principle

The CRM should be the authoritative system for business and sales data.

                    CRM
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
      Leads      Salespeople   Activities
        │
        ▼
   Conversations
        │
        ▼
    AI / RAG Layer
        │
        ▼
 Structured Intent
        │
        ▼
    CRM Service
        │
        ▼
     Database

The key architectural principle is:

The AI can understand conversations and propose structured CRM
actions, but only the validated backend CRM service should modify CRM
data.