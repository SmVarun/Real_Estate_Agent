import Lead from "../models/lead.model.js";
import User from "../models/user.model.js";
import { LEAD_STATUS, LEAD_STATUS_VALUES } from "../constants/lead.js";
import { ROLES } from "../constants/roles.js";

const notFoundError = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

const badRequestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

/*
 * Everything a client is allowed to see about a lead's owner.
 * Kept narrow for the same reason toPublicUser exists.
 */
const ASSIGNEE_FIELDS = "name email username role isActive";
const AUTHOR_FIELDS = "name username";

const withRelations = (query) =>
  query
    .populate("assignedTo", ASSIGNEE_FIELDS)
    .populate("createdBy", AUTHOR_FIELDS);

/*
 * A sales rep only ever sees their own book. Admins and managers
 * see everything.
 *
 * This is per-user visibility, NOT tenancy — the CRM serves one
 * company and there is no companyId anywhere in the model.
 */
const visibilityFilter = (actor) => {
  if (actor.role === ROLES.ADMIN || actor.role === ROLES.MANAGER) {
    return {};
  }

  return { assignedTo: actor._id };
};

/*
 * Reject an assignment to someone who cannot act on it before it is
 * written, rather than leaving a lead owned by a deleted account.
 */
const assertAssignableUser = async (userId) => {
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId).select("_id isActive");

  if (!user) {
    throw badRequestError("Cannot assign to a user that does not exist");
  }

  if (!user.isActive) {
    throw badRequestError("Cannot assign a lead to an inactive user");
  }

  return user._id;
};

/*
 * Statuses that mean a lead is still being worked. A rep whose book is
 * full of CONVERTED and LOST leads is not actually busy, so only these
 * count toward their load.
 */
const OPEN_LEAD_STATUSES = Object.freeze([
  LEAD_STATUS.NEW,
  LEAD_STATUS.CONTACTED,
  LEAD_STATUS.INTERESTED,
  LEAD_STATUS.HIGHLY_INTERESTED,
  LEAD_STATUS.QUALIFIED,
]);

/*
 * Pick the salesperson who should take the next inbound lead.
 *
 * Least-loaded wins: count each eligible rep's open leads and take the
 * smallest. Ties break on the rep who has gone longest without a new
 * lead, then on id — so the choice is deterministic and two reps with
 * an empty book alternate instead of one of them taking everything.
 *
 * Eligibility is deliberately narrow: an ACTIVE user whose role is
 * SALES_REP. Admins and managers run the pipeline, they are not in the
 * inbound rotation.
 *
 * Returns null when there is nobody to assign to. That is a normal
 * outcome, not an error — the caller still creates the lead.
 */
const selectAvailableSalesperson = async () => {
  const eligible = await User.find({
    role: ROLES.SALES_REP,
    isActive: true,
  })
    .select("_id")
    .lean();

  if (eligible.length === 0) {
    return null;
  }

  const eligibleIds = eligible.map((user) => user._id);

  /*
   * One grouped count in the database rather than a query per rep.
   * Reps with no open leads are absent from the result, which is why
   * the map below defaults them to zero instead of skipping them.
   */
  const loads = await Lead.aggregate([
    {
      $match: {
        assignedTo: { $in: eligibleIds },
        status: { $in: [...OPEN_LEAD_STATUSES] },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        openLeads: { $sum: 1 },
        lastAssignedAt: { $max: "$createdAt" },
      },
    },
  ]);

  const loadById = new Map(
    loads.map((entry) => [
      entry._id.toString(),
      { openLeads: entry.openLeads, lastAssignedAt: entry.lastAssignedAt },
    ])
  );

  const ranked = eligibleIds
    .map((id) => {
      const key = id.toString();
      const load = loadById.get(key);

      return {
        id,
        key,
        openLeads: load?.openLeads ?? 0,
        /* Never assigned anything -> longest idle. */
        lastAssignedAt: load?.lastAssignedAt?.getTime() ?? 0,
      };
    })
    .sort(
      (a, b) =>
        a.openLeads - b.openLeads ||
        a.lastAssignedAt - b.lastAssignedAt ||
        a.key.localeCompare(b.key)
    );

  return ranked[0].id;
};

const activityEntry = ({ type, text, actor }) => ({
  type,
  text,
  actor: actor?._id ?? null,
});

const createLead = async ({ data, actor }) => {
  const assignedTo = await assertAssignableUser(data.assignedTo);

  const lead = await Lead.create({
    ...data,
    assignedTo,
    createdBy: actor._id,
    lastInteraction: new Date(),
    activity: [
      activityEntry({ type: "created", text: "Lead created", actor }),
    ],
  });

  return withRelations(Lead.findById(lead._id));
};

const listLeads = async ({ filters, actor }) => {
  const { status, source, assignedTo, search, page, limit } = filters;

  const query = { ...visibilityFilter(actor) };

  if (status) {
    query.status = status;
  }

  if (source) {
    query.source = source;
  }

  /*
   * A rep's visibility filter already pins assignedTo to themselves,
   * so an explicit filter may only narrow within what they can see —
   * never widen it. Applying it unconditionally would let a rep read
   * another user's leads by passing their id.
   */
  if (assignedTo && !query.assignedTo) {
    query.assignedTo = assignedTo === "UNASSIGNED" ? null : assignedTo;
  }

  if (search) {
    /*
     * Escaped: a lead search box is user input, and an unescaped
     * regex is both a correctness and a CPU problem.
     */
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");

    query.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    withRelations(
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ),
    Lead.countDocuments(query),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getLeadById = async ({ leadId, actor }) => {
  const lead = await withRelations(
    Lead.findOne({ _id: leadId, ...visibilityFilter(actor) })
  );

  /*
   * A lead outside the caller's visibility is reported as missing
   * rather than forbidden — otherwise the 403 confirms it exists.
   */
  if (!lead) {
    throw notFoundError("Lead not found");
  }

  return lead;
};

/*
 * Load a lead the actor is allowed to modify. Returns the raw
 * document so the caller can mutate and save it.
 */
const loadWritableLead = async ({ leadId, actor }) => {
  const lead = await Lead.findOne({
    _id: leadId,
    ...visibilityFilter(actor),
  });

  if (!lead) {
    throw notFoundError("Lead not found");
  }

  return lead;
};

const updateLead = async ({ leadId, data, actor }) => {
  const lead = await loadWritableLead({ leadId, actor });

  /*
   * Reassignment through a bulk edit still has to pass the same
   * validation the dedicated endpoint uses.
   */
  if ("assignedTo" in data) {
    data.assignedTo = await assertAssignableUser(data.assignedTo);
  }

  Object.assign(lead, data);

  lead.activity.unshift(
    activityEntry({ type: "updated", text: "Lead details updated", actor })
  );

  lead.lastInteraction = new Date();

  await lead.save();

  return withRelations(Lead.findById(lead._id));
};

const updateLeadStatus = async ({ leadId, status, actor }) => {
  if (!LEAD_STATUS_VALUES.includes(status)) {
    throw badRequestError("Invalid lead status");
  }

  const lead = await loadWritableLead({ leadId, actor });

  if (lead.status === status) {
    return withRelations(Lead.findById(lead._id));
  }

  lead.status = status;

  lead.activity.unshift(
    activityEntry({
      type: "status",
      text: `Status changed to ${status}`,
      actor,
    })
  );

  lead.lastInteraction = new Date();

  await lead.save();

  return withRelations(Lead.findById(lead._id));
};

/*
 * Assignment is a management action: the route restricts it to
 * admins and managers, so a rep cannot hand their own lead away or
 * take someone else's.
 */
const assignLead = async ({ leadId, assignedTo, actor }) => {
  const lead = await loadWritableLead({ leadId, actor });

  const assigneeId = await assertAssignableUser(assignedTo);

  lead.assignedTo = assigneeId;

  let text = "Lead unassigned";

  if (assigneeId) {
    const assignee = await User.findById(assigneeId).select("name");
    text = `Assigned to ${assignee?.name ?? "a team member"}`;
  }

  lead.activity.unshift(activityEntry({ type: "assign", text, actor }));

  lead.lastInteraction = new Date();

  await lead.save();

  return withRelations(Lead.findById(lead._id));
};

const addNote = async ({ leadId, text, actor }) => {
  const lead = await loadWritableLead({ leadId, actor });

  lead.notes.unshift({
    text,
    author: actor._id,
    authorName: actor.name,
  });

  lead.activity.unshift(
    activityEntry({ type: "note", text: "Note added", actor })
  );

  lead.lastInteraction = new Date();

  await lead.save();

  return withRelations(Lead.findById(lead._id));
};

const deleteLead = async ({ leadId, actor }) => {
  const lead = await loadWritableLead({ leadId, actor });

  await Lead.findByIdAndDelete(lead._id);

  return lead;
};

/*
 * The dashboard's numbers, computed in the database rather than by
 * pulling every lead into the API process.
 *
 * Scoped by the same visibility rule as the list, so a rep's
 * dashboard counts their own book and nothing else.
 */
const getLeadStats = async ({ actor }) => {
  const scope = visibilityFilter(actor);

  const [byStatus, bySource, total, unassigned, activeUsers] =
    await Promise.all([
      Lead.aggregate([
        { $match: scope },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: scope },
        { $group: { _id: "$source", count: { $sum: 1 } } },
      ]),
      Lead.countDocuments(scope),
      Lead.countDocuments({ ...scope, assignedTo: null }),
      User.countDocuments({ isActive: true }),
    ]);

  /*
   * Return every status, including the ones with no leads — the
   * charts need a zero, not a missing key.
   */
  const statusCounts = Object.fromEntries(
    LEAD_STATUS_VALUES.map((value) => [value, 0])
  );

  byStatus.forEach(({ _id, count }) => {
    if (_id in statusCounts) {
      statusCounts[_id] = count;
    }
  });

  const sourceCounts = {};

  bySource.forEach(({ _id, count }) => {
    if (_id) {
      sourceCounts[_id] = count;
    }
  });

  return {
    total,
    unassigned,
    activeUsers,
    byStatus: statusCounts,
    bySource: sourceCounts,
  };
};

/*
 * A flattened, recent-first view of every lead's activity — the
 * dashboard feed. Built with an aggregation because the entries
 * live inside each lead rather than in a collection of their own.
 */
const getRecentActivity = async ({ actor, limit = 20 }) => {
  const scope = visibilityFilter(actor);

  return Lead.aggregate([
    { $match: scope },
    { $unwind: "$activity" },
    { $sort: { "activity.createdAt": -1 } },
    { $limit: limit },
    {
      $project: {
        _id: "$activity._id",
        type: "$activity.type",
        text: "$activity.text",
        createdAt: "$activity.createdAt",
        leadId: "$_id",
        leadName: "$name",
      },
    },
  ]);
};

export {
  createLead,
  selectAvailableSalesperson,
  OPEN_LEAD_STATUSES,
  listLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  addNote,
  deleteLead,
  getLeadStats,
  getRecentActivity,
};
