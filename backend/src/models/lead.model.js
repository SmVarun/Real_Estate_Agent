import mongoose from "mongoose";

import {
  LEAD_STATUS_VALUES,
  DEFAULT_LEAD_STATUS,
  LEAD_SOURCES,
  DEFAULT_LEAD_SOURCE,
  LEAD_ACTIVITY_TYPES,
} from "../constants/lead.js";

/*
 * Notes and activity are embedded rather than separate collections:
 * they are only ever read as part of one lead, never queried across
 * leads, and a lead's history is small and bounded in practice.
 */
const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    authorName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Written only by the service layer — every entry is a record of
 * something the server actually did, so there is no client-facing
 * write path for it.
 */
const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: LEAD_ACTIVITY_TYPES,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    propertyInterest: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    budget: {
      type: String,
      trim: true,
      default: "",
    },

    bhk: {
      type: String,
      trim: true,
      default: "",
    },

    area: {
      type: String,
      trim: true,
      default: "",
    },

    requirements: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: DEFAULT_LEAD_SOURCE,
    },

    status: {
      type: String,
      enum: LEAD_STATUS_VALUES,
      default: DEFAULT_LEAD_STATUS,
      index: true,
    },

    /*
     * The salesperson who owns this lead. Any active user may be
     * assigned — the CRM's "salespeople" are its users, not a
     * separate collection.
     */
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /*
     * Null for leads the server created on its own behalf — a public
     * visitor qualifying through the AI chat has no CRM account, so
     * there is no user to record here. Every lead created through the
     * authenticated API still carries its author.
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
     * Bumped by the service whenever something happens on the lead,
     * so "needs attention" ordering does not depend on updatedAt,
     * which any field edit would move.
     */
    lastInteraction: {
      type: Date,
      default: Date.now,
    },

    /*
     * Opaque, server-issued identifier for the anonymous browser
     * session that created this lead through the public AI chat.
     *
     * It is the ONLY thing that ties a public chat request to a lead:
     * the browser never sends a leadId, it sends its session cookie
     * and the server resolves the lead from it. Null for every lead
     * created inside the authenticated CRM.
     */
    chatSessionId: {
      type: String,
      default: null,
      select: false,
    },

    notes: {
      type: [noteSchema],
      default: [],
    },

    activity: {
      type: [activitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/*
 * The list view is always sorted newest-first and commonly filtered
 * by status, so index the pair rather than status alone.
 */
leadSchema.index({ status: 1, createdAt: -1 });

/*
 * Uniqueness for chat sessions, but only over the leads that HAVE one.
 *
 * A plain sparse unique index is not enough here: sparse skips
 * documents where the field is absent, and every CRM lead stores an
 * explicit null for it — so they would all collide with each other on
 * that null. A partial index filtered to string values covers only the
 * public-chat leads and leaves the rest out of the index entirely.
 */
leadSchema.index(
  { chatSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { chatSessionId: { $type: "string" } },
  }
);

/*
 * Duplicate detection scans recent AI-chat leads by phone. Without
 * this it is a collection scan on every public qualification.
 */
leadSchema.index({ source: 1, createdAt: -1 });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
