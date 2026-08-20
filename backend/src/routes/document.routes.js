import express from "express";

import { uploadDocumentHandler } from "../controllers/document.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";

import { uploadSingleDocument } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN));

router.post("/", uploadSingleDocument , uploadDocumentHandler);

export default router;