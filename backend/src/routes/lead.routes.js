import express from "express";

import {
  createLeadHandler,
  listLeadsHandler,
  getLeadHandler,
  updateLeadHandler,
  updateLeadStatusHandler,
  assignLeadHandler,
  addNoteHandler,
  deleteLeadHandler,
  getLeadStatsHandler,
  getRecentActivityHandler,
} from "../controllers/lead.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/*
 * Every role works leads — a sales rep's whole job is here. The
 * service narrows what a rep can see to the leads assigned to them,
 * so the guard below is authentication, not authorization.
 */
router.use(requireAuth);

/*
 * Declared before "/:id" so the literal paths are not captured by
 * the parameterised route.
 */
router.get("/stats", getLeadStatsHandler);
router.get("/activity", getRecentActivityHandler);

router.get("/", listLeadsHandler);
router.post("/", createLeadHandler);

router.get("/:id", getLeadHandler);
router.patch("/:id", updateLeadHandler);
router.patch("/:id/status", updateLeadStatusHandler);

/*
 * Deciding who works a lead is a management action — a rep must not
 * be able to hand their own lead away or claim someone else's.
 */
router.patch(
  "/:id/assign",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  assignLeadHandler
);

router.post("/:id/notes", addNoteHandler);

/*
 * Destructive and unrecoverable — a lead's whole history goes with
 * it, so keep it with the roles accountable for the pipeline.
 */
router.delete(
  "/:id",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  deleteLeadHandler
);

export default router;
