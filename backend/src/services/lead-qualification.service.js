import Lead from "../models/lead.model.js";
import User from "../models/user.model.js";

import { LEAD_STATUS } from "../constants/lead.js";
import { selectAvailableSalesperson } from "./lead.service.js";
import { normalisePhone, phoneKey } from "../utils/phone.js";
import { createChatSessionId } from "../utils/chat-session.js";

/*
 * Turning an anonymous chat visitor into a real CRM lead.
 *
 *   validated qualification -> Lead -> automatic assignment -> session
 *
 * This is the only write path a public, unauthenticated caller has
 * into the Lead collection, so everything the client could otherwise
 * influence is decided here instead: the source, the status, the
 * assignee, and the session the lead is bound to. The controller
 * passes through nothing but the three qualification fields.
 */

/*
 * Every lead captured this way is tagged with the existing "AI Agent"
 * source, so the Leads page and the source chart separate them from
 * manual entry with no new enum value and no UI change.
 */
const AI_CHAT_SOURCE = "AI Agent";

/*
 * How far back a returning contact is treated as the same enquiry.
 *
 * A refresh, a double-click or a second tab all land inside this
 * window and reuse the lead that already exists. Somebody who comes
 * back next week is a genuinely new enquiry and gets a new lead —
 * rejecting them would lose a real prospect, which is a far worse
 * outcome than a duplicate row.
 */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

/*
 * What the public is allowed to learn about the salesperson they were
 * assigned to: a first name, and nothing else. No id, no email, no
 * username, no role.
 */
const toPublicAdvisor = (user) => {
  if (!user) {
    return null;
  }

  return {
    firstName: (user.name || "").trim().split(/\s+/)[0] || "Our team",
  };
};

/*
 * Find a lead this same contact opened very recently for the same
 * location.
 *
 * Matching is on the normalised phone KEY rather than the stored
 * string, so "+91 98765 43210" and "09876543210" are the same person.
 * Location is compared case-insensitively and exactly, because a
 * different city really is a different enquiry.
 */
const findRecentDuplicate = async ({ contactKey, preferredLocation }) => {
  if (!contactKey) {
    return null;
  }

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);

  /*
   * Phone is stored formatted, not keyed, so the digits are matched
   * with an anchored regex on the trailing local digits. The candidate
   * set is already narrowed by source and time, so this never scans
   * the whole collection.
   */
  const escapedKey = contactKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const candidates = await Lead.find({
    source: AI_CHAT_SOURCE,
    createdAt: { $gte: since },
    phone: new RegExp(escapedKey + "$"),
  })
    .select("+chatSessionId")
    .sort({ createdAt: -1 })
    .limit(10);

  const wantedLocation = preferredLocation.trim().toLowerCase();

  return (
    candidates.find(
      (lead) => (lead.location || "").trim().toLowerCase() === wantedLocation
    ) || null
  );
};

/*
 * Assign the lead, then save.
 *
 * Assignment failure must never lose the lead — the visitor has
 * already given us their details and the CRM would rather hold an
 * unassigned lead than none at all. So a failure here is logged and
 * swallowed, and the lead is returned in whatever state it reached.
 */
const tryAssign = async (lead) => {
  try {
    const assigneeId = await selectAvailableSalesperson();

    if (!assigneeId) {
      lead.activity.unshift({
        type: "assign",
        text: "No sales executive available — awaiting assignment",
        actor: null,
      });

      await lead.save();
      return lead;
    }

    const assignee = await User.findById(assigneeId).select("name");

    lead.assignedTo = assigneeId;

    lead.activity.unshift({
      type: "assign",
      text: `Auto-assigned to ${assignee?.name ?? "a team member"}`,
      actor: null,
    });

    await lead.save();

    return lead;
  } catch (error) {
    /*
     * Worth investigating, but not worth failing the visitor's
     * submission over.
     */
    console.error("[QUALIFY] Automatic assignment failed", error);

    return lead;
  }
};

/*
 * The whole qualification step.
 *
 * `existingSessionId` is the session cookie the browser already had,
 * if any. When it resolves to a lead, that lead is reused rather than
 * a second one being created — that is what makes a refresh or a
 * double submit safe.
 *
 * There is no MongoDB transaction here, and that is a choice rather
 * than a limitation — the deployment is an Atlas replica set, so one
 * was available. The flow simply does not need it: there is exactly
 * one document, created once and then mutated in place. A transaction
 * would only give us the option of rolling the lead back if assignment
 * failed, which is precisely the outcome we do not want. The worst
 * partial failure here leaves a real, visible, unassigned lead — which
 * a manager can act on — rather than losing the enquiry.
 */
const qualifyLead = async ({
  name,
  contact,
  preferredLocation,
  existingSessionId = null,
}) => {
  const phone = normalisePhone(contact);
  const contactKey = phoneKey(contact);

  /*
   * 1. This browser already has a lead. Reuse it — a refresh must not
   *    create a second one.
   */
  if (existingSessionId) {
    const existing = await Lead.findOne({
      chatSessionId: existingSessionId,
    }).select("+chatSessionId");

    if (existing) {
      const assignee = existing.assignedTo
        ? await User.findById(existing.assignedTo).select("name")
        : null;

      return {
        lead: existing,
        sessionId: existingSessionId,
        advisor: toPublicAdvisor(assignee),
        reused: true,
      };
    }
  }

  /*
   * 2. A different browser (or a cleared cookie), but the same person
   *    enquiring about the same place minutes ago. Reuse and re-bind
   *    the session so this browser can carry on the conversation.
   */
  const duplicate = await findRecentDuplicate({
    contactKey,
    preferredLocation,
  });

  if (duplicate) {
    const sessionId = duplicate.chatSessionId || createChatSessionId();

    if (!duplicate.chatSessionId) {
      duplicate.chatSessionId = sessionId;
      await duplicate.save();
    }

    const assignee = duplicate.assignedTo
      ? await User.findById(duplicate.assignedTo).select("name")
      : null;

    return {
      lead: duplicate,
      sessionId,
      advisor: toPublicAdvisor(assignee),
      reused: true,
    };
  }

  /*
   * 3. A genuinely new enquiry.
   *
   * Note what is NOT taken from the request: source, status,
   * assignedTo and chatSessionId are all set here. A public caller
   * cannot choose their own salesperson or forge a status.
   */
  const lead = await Lead.create({
    name,
    phone,
    location: preferredLocation,
    source: AI_CHAT_SOURCE,
    status: LEAD_STATUS.NEW,
    assignedTo: null,
    createdBy: null,
    chatSessionId: createChatSessionId(),
    lastInteraction: new Date(),
    activity: [
      {
        type: "created",
        text: "Lead captured from AI Chat qualification",
        actor: null,
      },
    ],
  });

  const assigned = await tryAssign(lead);

  const assignee = assigned.assignedTo
    ? await User.findById(assigned.assignedTo).select("name")
    : null;

  return {
    lead: assigned,
    sessionId: lead.chatSessionId,
    advisor: toPublicAdvisor(assignee),
    reused: false,
  };
};

/*
 * Resolve the lead a public chat request belongs to, from its session
 * cookie alone.
 *
 * The browser never names a lead, so there is no id to tamper with and
 * no way to reach somebody else's enquiry by guessing. A missing or
 * unknown session simply has no lead.
 */
const findLeadByChatSession = async (sessionId) => {
  if (!sessionId) {
    return null;
  }

  return Lead.findOne({ chatSessionId: sessionId }).select("+chatSessionId");
};

/*
 * Record that the visitor is still talking to us, so a lead that is
 * actively in conversation does not look stale on the dashboard.
 */
const touchLeadInteraction = async (leadId) => {
  try {
    await Lead.updateOne(
      { _id: leadId },
      { $set: { lastInteraction: new Date() } }
    );
  } catch (error) {
    /* Bookkeeping — never fail the visitor's question over it. */
    console.error("[QUALIFY] Could not update lastInteraction", error);
  }
};

export {
  qualifyLead,
  findLeadByChatSession,
  touchLeadInteraction,
  toPublicAdvisor,
  AI_CHAT_SOURCE,
  DUPLICATE_WINDOW_MS,
};
