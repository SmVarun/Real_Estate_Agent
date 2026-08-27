/*
 * Single source of truth for lead enums.
 *
 * The lead model, the lead validator, and the frontend constants
 * module all read from here so a new status can never be half-added.
 * Mirrors the pattern in constants/roles.js.
 */
const LEAD_STATUS = Object.freeze({
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  INTERESTED: "INTERESTED",
  HIGHLY_INTERESTED: "HIGHLY_INTERESTED",
  QUALIFIED: "QUALIFIED",
  CONVERTED: "CONVERTED",
  NOT_INTERESTED: "NOT_INTERESTED",
  LOST: "LOST",
});

const LEAD_STATUS_VALUES = Object.freeze(Object.values(LEAD_STATUS));

const DEFAULT_LEAD_STATUS = LEAD_STATUS.NEW;

const LEAD_SOURCES = Object.freeze([
  "Website",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Referral",
  "Advertisement",
  "AI Agent",
  "Manual",
]);

const DEFAULT_LEAD_SOURCE = "Manual";

/*
 * Activity entries are appended by the service on every state
 * change, never written directly by a client.
 */
const LEAD_ACTIVITY_TYPES = Object.freeze([
  "created",
  "status",
  "assign",
  "note",
  "updated",
]);

export {
  LEAD_STATUS,
  LEAD_STATUS_VALUES,
  DEFAULT_LEAD_STATUS,
  LEAD_SOURCES,
  DEFAULT_LEAD_SOURCE,
  LEAD_ACTIVITY_TYPES,
};
