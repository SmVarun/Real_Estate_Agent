/*
 * Adapters between the backend's documents and the shapes the
 * existing components already read.
 *
 * The UI was written against `id`, and against `assignedTo` being a
 * plain id it can look up. Mongo gives `_id`, and populates
 * `assignedTo` into a whole user object. Reconciling that here — once,
 * at the edge — is what lets every table, form and panel stay exactly
 * as it was written.
 *
 * These are shape adapters only. They never invent a value the
 * backend did not send.
 */

/*
 * ObjectId values arrive as strings over JSON, but a populated
 * reference arrives as an object. Accept either.
 */
const toId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id ?? value.id ?? null;
};

/* A populated ref is an object; an unpopulated one is just an id. */
const isPopulated = (value) =>
  Boolean(value) && typeof value === "object" && (value.name || value.email);

export const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: toId(user),
  };
};

export const normalizeLead = (lead) => {
  if (!lead) {
    return null;
  }

  const assignee = isPopulated(lead.assignedTo)
    ? normalizeUser(lead.assignedTo)
    : null;

  return {
    ...lead,
    id: toId(lead),

    /*
     * Flattened back to an id because that is what LeadTable,
     * LeadForm, LeadFilters and AssignmentModal all compare against.
     * The full object stays available as `assignee` for the places
     * that want a name without a second lookup.
     */
    assignedTo: toId(lead.assignedTo),
    assignee,

    createdBy: toId(lead.createdBy),
    creator: isPopulated(lead.createdBy) ? normalizeUser(lead.createdBy) : null,

    notes: (lead.notes || []).map((note) => ({
      ...note,
      id: toId(note),
      /*
       * The components render `author` as a name. The backend stores
       * the author id separately from the name captured at write
       * time, so hand over the name and keep the id addressable.
       */
      author: note.authorName,
      authorId: toId(note.author),
    })),

    activity: (lead.activity || []).map((entry) => ({
      ...entry,
      id: toId(entry),
      /* The UI's field name for when something happened. */
      timestamp: entry.createdAt,
    })),
  };
};

export const normalizeActivityEntry = (entry) => ({
  ...entry,
  id: toId(entry),
  leadId: toId(entry.leadId),
  timestamp: entry.createdAt,
});

export const normalizeDocument = (document) => {
  if (!document) {
    return null;
  }

  return {
    ...document,
    id: toId(document),
    uploader: isPopulated(document.uploadedBy)
      ? normalizeUser(document.uploadedBy)
      : null,
    uploadedBy: toId(document.uploadedBy),
  };
};

export const normalizeCompany = (company) => {
  if (!company) {
    return null;
  }

  return {
    ...company,
    id: toId(company),
  };
};

export { toId };
