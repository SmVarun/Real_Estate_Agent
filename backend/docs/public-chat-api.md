# Public Chat & Lead Qualification API

The client-facing side of the assistant. A prospective buyer with **no
CRM account** qualifies themselves, becomes a real Lead, gets assigned
to a salesperson, and only then may ask the RAG assistant questions.

The authenticated CRM assistant (`POST /api/v1/chat`, documented in
`chat-api.md`) is unchanged and unaffected.

---

## 1. Why a qualification gate

The assistant is never asked to collect the visitor's name, phone
number or location as free-form conversation. A model can misread a
phone number; a form cannot. So the structured fields are captured
first, validated on the server, and written to the CRM **before** the
first question is answered. After that the model does one job: answer
property questions from the knowledge base.

---

## 2. Flow

```
POST /api/v1/chat/qualify        (public, rate limited)
      -> zod validation           name / contact / preferredLocation
      -> lead-qualification.service.js
             -> reuse existing lead?      session cookie, then recent duplicate
             -> Lead.create               source "AI Agent", status NEW
             -> selectAvailableSalesperson least-loaded active sales_rep
             -> assign + activity entry
      -> Set-Cookie: chatSession (httpOnly)
      -> { qualificationComplete, name, advisor }

POST /api/v1/chat/public         (public, rate limited)
      -> resolve lead FROM the chatSession cookie   (401 if none)
      -> chat.service.js  (the same RAG pipeline, unchanged)
      -> touch lead.lastInteraction
      -> { answer, sources, contextFound }
```

---

## 3. `POST /api/v1/chat/qualify`

No authentication. Rate limited to **5 requests / 15 minutes** per
source address.

### Request

```json
{
  "name": "Rahul Sharma",
  "contact": "+91 98765 43210",
  "preferredLocation": "Noida"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | trimmed, 2–100 chars, must contain a letter |
| `contact` | string | yes | trimmed, ≤20 chars, valid phone (see below) |
| `preferredLocation` | string | yes | trimmed, 2–150 chars |

Any other key — `source`, `status`, `assignedTo`, `createdBy` — is
**stripped by Zod and ignored**. A public caller cannot choose their
own salesperson, forge a status, or attribute the lead to a user.

### Phone rules (`utils/phone.js`)

Only digits, spaces and `+ - . ( )` are accepted; 7–15 digits; a single
repeated digit (`0000000000`) is rejected. Deliberately permissive
about country conventions and strict only about what is always wrong.

- **Stored** as `normalisePhone` output: `+919876543210`
- **Compared** as `phoneKey` output (last 10 digits): `9876543210`,
  so `+91 98765 43210` and `09876543210` are the same person.

### Response `201`

```json
{
  "success": true,
  "message": "Thanks — your enquiry has been received.",
  "data": {
    "qualificationComplete": true,
    "name": "Rahul Sharma",
    "advisor": { "firstName": "Aman" }
  }
}
```

`advisor` is `null` when no salesperson was available. **The visitor
sees the same success either way** — an internal staffing gap is not
their problem, and the lead exists in the CRM regardless.

Note what is absent: no `leadId`, no salesperson id, no email, no
status, no assignment reasoning.

### Errors

| Status | When |
|---|---|
| 400 | Validation failed — `errors[]` carries `{ field, message }` |
| 429 | Rate limit exceeded |

---

## 4. `POST /api/v1/chat/public`

No authentication, but **requires a valid `chatSession` cookie**. Rate
limited to **20 requests / 5 minutes**.

```json
{ "message": "What properties do you have in Noida?" }
```

Response is byte-identical in shape to the authenticated chat:
`{ answer, sources, contextFound }`. Same retrieval, same prompt, same
grounding rules, same hard no-context refusal.

`401` when the session cookie is missing, malformed or unknown.

---

## 5. `GET /api/v1/chat/session`

Lets a returning browser find out whether it has already qualified, so
a page refresh lands in the chat instead of showing the form again —
and, more importantly, does not create a second lead.

```json
{
  "success": true,
  "data": {
    "qualificationComplete": true,
    "name": "Rahul Sharma",
    "advisor": { "firstName": "Aman" }
  }
}
```

Returns only a boolean and display strings — never the lead itself.

---

## 6. Anonymous session identity

A public visitor has no account, so something must tie their chat
requests to their lead. That something is the `chatSession` cookie:

- **server-issued**, 256 bits from a CSPRNG — never client-supplied
- **httpOnly**, so page JavaScript cannot read it and XSS cannot steal it
- **opaque** — it encodes nothing, it is only ever looked up
- the server resolves the lead **from** it; the browser never sends a
  `leadId`, so there is no id for anyone to tamper with

A body-supplied `leadId` is ignored entirely. Guessing another
visitor's session is a 2^256 search.

Stored on the Lead as `chatSessionId`, which is `select: false` — it
never leaves the API in any lead response.

It is **not** an authentication token and grants nothing beyond "keep
talking about the enquiry this browser opened". Max age 7 days.

---

## 7. Duplicate protection

A visitor may refresh, double-click, or come back in a second tab.
Three checks, in order:

1. **Session cookie resolves to a lead** → reuse it.
2. **Same phone key + same location, within 24 hours** → reuse that
   lead and re-bind the session to this browser.
3. Otherwise → create a new lead.

Somebody returning next week is a genuinely new enquiry and gets a new
lead. Rejecting a real returning prospect is a worse outcome than a
duplicate row, so the window is deliberately short.

**Behaviour chosen for this MVP: reuse the existing lead.** No second
interaction record is created, because there is no Conversation model
to attach one to (see Limitations).

---

## 8. Assignment

`selectAvailableSalesperson()` in `lead.service.js` — one algorithm,
shared, not a competing second one.

- **Eligible**: `role === "sales_rep"` **and** `isActive === true`.
  Admins and managers run the pipeline; they are not in the rotation.
- **Load**: count of leads in an *open* status — `NEW`, `CONTACTED`,
  `INTERESTED`, `HIGHLY_INTERESTED`, `QUALIFIED`. `CONVERTED`,
  `NOT_INTERESTED` and `LOST` do not count: a rep whose book is full of
  closed leads is not actually busy.
- **Choice**: fewest open leads wins. Ties break on longest-since-last-
  assigned, then on id — so it is deterministic, and two reps with
  empty books alternate rather than one taking everything.
- Computed with a single grouped aggregation, not a query per rep.

**No salesperson available** → the lead is still created, with
`assignedTo: null`. It shows as *Unassigned* in the Leads table and
counts in the dashboard's `unassigned` stat. Assignment failure is
logged and swallowed; it never costs us the enquiry.

---

## 9. Atomicity

There is **no MongoDB transaction**, and that is a choice rather than a
limitation — the deployment is an Atlas replica set, so one was
available.

The flow does not need it: there is exactly one document, created once
and then mutated in place. A transaction would only offer the ability
to roll the lead back when assignment failed, which is precisely the
outcome we do not want. The worst partial failure leaves a real,
visible, unassigned lead that a manager can act on.

Duplicate leads are prevented by the reuse rules in §7, not by
retry-safety at the storage layer.

---

## 10. Security summary

| Concern | Mitigation |
|---|---|
| Input validation | Server-side Zod; the browser's copy is a courtesy only |
| Field injection | Zod strips unknown keys; source/status/assignee set server-side |
| Arbitrary assignment | Frontend never names a salesperson |
| Arbitrary lead access | Lead resolved from httpOnly cookie; body `leadId` ignored |
| Session forgery | 256-bit CSPRNG value, shape-checked before any lookup |
| Salesperson privacy | Only a first name is ever returned — no id, email or role |
| Internal leakage | `chatSessionId` is `select: false`; errors are generic |
| Abuse | Per-route rate limits on all three public endpoints |
| Admin endpoints | Untouched; still behind `requireAuth` + `requireRole` |

---

## 11. Limitations

- **Conversation history is not persisted.** There is no Conversation
  or Message model, and none was invented. The lead carries the
  qualification data and an activity trail; the transcript itself lives
  in the browser tab and is lost on refresh. The API is shaped so a
  Conversation model can be attached later without changing the client
  contract.
- **Rate limiting is in-process.** Counters are per-process and reset
  on restart. This raises the cost of abuse; it does not make it
  impossible. A multi-instance deployment needs a shared store.
- **`req.ip` needs `trust proxy`** to be accurate behind a load
  balancer. Client-supplied `X-Forwarded-For` is deliberately **not**
  trusted, so today the limit keys on the socket address.
- **Refresh keeps the lead, not the transcript.** The session cookie
  restores *who* the visitor is; the messages are gone. The UI says so
  rather than implying persistence.
