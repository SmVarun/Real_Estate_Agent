import { z } from "zod";
import mongoose from "mongoose";

import {
  LEAD_STATUS_VALUES,
  LEAD_SOURCES,
} from "../constants/lead.js";

const objectId = z
  .string()
  .trim()
  .refine(
    (value) => mongoose.Types.ObjectId.isValid(value),
    "Invalid id"
  );

/*
 * Optional free-text field: absent and "" both mean "not provided",
 * so normalise them to the same thing instead of storing null.
 */
const optionalText = (max) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/*
 * NOTE: `createdBy`, `activity` and `notes` are intentionally absent.
 *
 * Zod strips unknown keys, so a client sending them has them silently
 * discarded here. All three are written by the service from the
 * authenticated user and from state changes the server performed —
 * accepting them from a client would let anyone forge a lead's
 * history. Notes are added through POST /leads/:id/notes instead.
 */
const createLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase())
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone number")
    .max(20, "Invalid phone number"),

  propertyInterest: optionalText(100),
  location: optionalText(150),
  budget: optionalText(50),
  bhk: optionalText(50),
  area: optionalText(50),
  requirements: optionalText(2000),

  source: z
    .enum(LEAD_SOURCES, {
      message: `Source must be one of: ${LEAD_SOURCES.join(", ")}`,
    })
    .optional(),

  status: z
    .enum(LEAD_STATUS_VALUES, {
      message: `Status must be one of: ${LEAD_STATUS_VALUES.join(", ")}`,
    })
    .optional(),

  /*
   * null is meaningful here — it is how a client clears an
   * assignment — so it is accepted alongside an id.
   */
  assignedTo: objectId.nullable().optional(),
});

const updateLeadSchema = createLeadSchema.partial();

const updateLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUS_VALUES, {
    message: `Status must be one of: ${LEAD_STATUS_VALUES.join(", ")}`,
  }),
});

const assignLeadSchema = z.object({
  assignedTo: objectId.nullable(),
});

const addNoteSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Note text is required")
    .max(2000, "Note cannot exceed 2000 characters"),
});

const leadIdParamSchema = z.object({
  id: objectId,
});

/*
 * Query params arrive as strings, so page/limit are coerced.
 * "ALL" is the frontend's own sentinel for an unset filter and is
 * treated here as absent.
 */
const listLeadsQuerySchema = z.object({
  status: z
    .enum(LEAD_STATUS_VALUES)
    .optional()
    .or(z.literal("ALL").transform(() => undefined)),

  source: z
    .enum(LEAD_SOURCES)
    .optional()
    .or(z.literal("ALL").transform(() => undefined)),

  assignedTo: z
    .union([
      objectId,
      z.literal("UNASSIGNED"),
      z.literal("ALL").transform(() => undefined),
    ])
    .optional(),

  search: z.string().trim().max(100).optional(),

  page: z.coerce.number().int().min(1).optional().default(1),

  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  addNoteSchema,
  leadIdParamSchema,
  listLeadsQuerySchema,
};
