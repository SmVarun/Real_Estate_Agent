import express from "express";

import { getMe, getUser, updateRole } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/*
 * Every route below needs a valid access token.
 */
router.use(requireAuth);

router.get("/me", getMe);

/*
 * Reading another user's profile is a management action.
 */
router.get("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), getUser);

/*
 * Granting privilege is admin-only — a manager must not be
 * able to promote anyone (including themselves) to admin.
 */
router.patch("/:id/role", requireRole(ROLES.ADMIN), updateRole);

export default router;
