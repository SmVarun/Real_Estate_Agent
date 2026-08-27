# Lead API Documentation

**API Version:** v1
**Base URL:** `http://localhost:3000/api/v1`
**Authentication:** httpOnly `accessToken` cookie
**Authorization:** every authenticated role, with per-role visibility (below)

---

# Overview

Leads are the CRM's core record: a prospective buyer, the property they
are interested in, who is working them, and the history of what has
happened.

This is a **single-company** API. There is no `companyId` anywhere in the
model — every lead belongs to the one organisation the application
serves.

## Visibility

Enforced server-side in `lead.service.js`, not by the client:

| Role        | Sees                                  |
| ----------- | ------------------------------------- |
| `admin`     | every lead                            |
| `manager`   | every lead                            |
| `sales_rep` | only leads where `assignedTo` is them |

A lead outside the caller's visibility returns **404**, not 403 — a 403
would confirm that the record exists.

## Fields the client may never set

`createdBy`, `notes` and `activity` are stripped by the Zod validator.
All three are written by the service from the authenticated user and
from state changes the server performed, so a client cannot forge a
lead's history. Notes are added through `POST /leads/:id/notes`.

---

# Endpoints

## `GET /leads`

List leads, newest first.

**Query parameters** (all optional):

| Name         | Type   | Notes                                                     |
| ------------ | ------ | --------------------------------------------------------- |
| `status`     | enum   | One of the lead statuses, or `ALL`                        |
| `source`     | enum   | One of the lead sources, or `ALL`                         |
| `assignedTo` | string | A user id, `UNASSIGNED`, or `ALL`                         |
| `search`     | string | Case-insensitive match on name, email or phone            |
| `page`       | number | Default `1`                                               |
| `limit`      | number | Default `100`, maximum `200`                              |

A `sales_rep` passing another user's id in `assignedTo` does not widen
their visibility — the filter may only narrow what they can already see.

**200**

```json
{
  "success": true,
  "data": [ { "_id": "...", "name": "...", "...": "..." } ],
  "pagination": { "page": 1, "limit": 100, "total": 1, "totalPages": 1 }
}
```

`assignedTo` and `createdBy` are populated objects, not bare ids.

---

## `POST /leads`

Create a lead.

**Body**

```json
{
  "name": "Rahul Sharma",
  "phone": "+91 98450 12345",
  "email": "rahul@example.com",
  "propertyInterest": "Apartment",
  "location": "Whitefield, Bengaluru",
  "budget": "₹85 Lakh",
  "bhk": "3 BHK",
  "area": "1450 sq.ft.",
  "requirements": "Prefers a corner unit.",
  "source": "WhatsApp",
  "status": "INTERESTED",
  "assignedTo": null
}
```

Only `name` and `phone` are required. **201** returns the created lead.

---

## `GET /leads/:id`

One lead, with its notes and activity. **404** if it does not exist *or*
is outside the caller's visibility.

---

## `PATCH /leads/:id`

Update any subset of the creatable fields. Appends an `updated` activity
entry.

---

## `PATCH /leads/:id/status`

```json
{ "status": "HIGHLY_INTERESTED" }
```

Appends a `status` activity entry. A no-op when the status is unchanged.

---

## `PATCH /leads/:id/assign`

**ADMIN and MANAGER only.** A rep cannot hand their own lead away or
claim someone else's.

```json
{ "assignedTo": "6a8f...cb" }
```

`null` unassigns. Assigning to a non-existent or inactive user is a
**400**.

---

## `POST /leads/:id/notes`

```json
{ "text": "Called, wants a site visit Saturday." }
```

**201** returns the whole updated lead. The author is taken from the
session, never from the body.

---

## `DELETE /leads/:id`

**ADMIN and MANAGER only.** Permanent — the lead's notes and activity go
with it.

---

## `GET /leads/stats`

Dashboard counts, aggregated in MongoDB rather than by loading every
lead into the API process. Scoped by the same visibility rule as the
list.

**200**

```json
{
  "success": true,
  "data": {
    "total": 12,
    "unassigned": 3,
    "activeUsers": 4,
    "byStatus": { "NEW": 2, "CONTACTED": 1, "...": 0 },
    "bySource": { "WhatsApp": 5, "Website": 7 }
  }
}
```

`byStatus` always contains every status, including zeroes, so a chart
never has to guess at a missing key.

---

## `GET /leads/activity`

A flattened, recent-first feed of activity across every visible lead —
the dashboard's "Recent Activity" panel. Limited to 20 entries.

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "status",
      "text": "Status changed to HIGHLY_INTERESTED",
      "createdAt": "2026-08-27T06:45:20.331Z",
      "leadId": "...",
      "leadName": "Rahul Sharma"
    }
  ]
}
```

---

# Enums

Defined once in `src/constants/lead.js` and mirrored in the frontend's
`src/constants/index.js`.

**Status:** `NEW`, `CONTACTED`, `INTERESTED`, `HIGHLY_INTERESTED`,
`QUALIFIED`, `CONVERTED`, `NOT_INTERESTED`, `LOST`

**Source:** `Website`, `WhatsApp`, `Instagram`, `Facebook`, `Referral`,
`Advertisement`, `AI Agent`, `Manual`

**Activity type:** `created`, `status`, `assign`, `note`, `updated`

---

# Errors

| Status | Meaning                                                       |
| ------ | ------------------------------------------------------------- |
| 400    | Validation failed, or assignment to a missing/inactive user   |
| 401    | No or expired `accessToken` cookie                            |
| 403    | Authenticated but not permitted (assign and delete)           |
| 404    | Lead not found, or outside the caller's visibility            |

Validation errors carry a per-field breakdown:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "phone", "message": "Invalid phone number" }]
}
```
