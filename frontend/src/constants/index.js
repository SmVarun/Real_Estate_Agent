/*
 * Values the backend actually accepts.
 *
 * Mirrors backend/src/constants/roles.js and constants/lead.js. If a
 * value is not in one of these lists, the backend's Zod validator will
 * reject it — so never add a "nicer" option here without adding it
 * there first.
 */

/* Mirrors backend ROLES. */
export const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  SALES_REP: "sales_rep",
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/* The stored role is a slug; this is what a person should read. */
export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: "Administrator",
  [ROLES.MANAGER]: "Sales Manager",
  [ROLES.SALES_REP]: "Sales Executive",
});

export const roleLabel = (role) => ROLE_LABELS[role] || "Team Member";

/*
 * Actions the backend restricts by role. Used to hide controls that
 * would only ever come back 403 — the server is still the authority,
 * this is presentation.
 */
export const isAdmin = (user) => user?.role === ROLES.ADMIN;

export const canManageTeam = (user) =>
  user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER;

/* Mirrors backend LEAD_STATUS. */
export const LEAD_STATUSES = Object.freeze([
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "HIGHLY_INTERESTED",
  "QUALIFIED",
  "CONVERTED",
  "NOT_INTERESTED",
  "LOST",
]);

export const LEAD_STATUS_LABELS = Object.freeze({
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  HIGHLY_INTERESTED: "Highly Interested",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not Interested",
  LOST: "Lost",
});

/* Mirrors backend LEAD_SOURCES. */
export const LEAD_SOURCES = Object.freeze([
  "Website",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Referral",
  "Advertisement",
  "AI Agent",
  "Manual",
]);

/*
 * Mirrors the document model's ingestionStatus enum. The backend owns
 * this lifecycle — the UI reports it and never assumes COMPLETED.
 */
export const INGESTION_STATUS = Object.freeze({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
});

export const INGESTION_STATUS_LABELS = Object.freeze({
  PENDING: "Queued",
  PROCESSING: "Indexing",
  COMPLETED: "Indexed",
  FAILED: "Failed",
});

/* Both are transient, so the documents list keeps polling while either shows. */
export const isIngestionInProgress = (status) =>
  status === INGESTION_STATUS.PENDING || status === INGESTION_STATUS.PROCESSING;

/* File types the backend's multer fileFilter accepts. */
export const ACCEPTED_DOCUMENT_TYPES = ".pdf,.txt,.doc,.docx,.xls,.xlsx";

/* Matches the backend's multer limit exactly. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
