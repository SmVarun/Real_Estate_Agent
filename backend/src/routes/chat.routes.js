import express from "express";

import { chatHandler } from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/*
 * Authenticated users of every role may query the knowledge base —
 * uploading documents is the admin-only action, reading them is not.
 */
router.use(requireAuth);

router.post("/", chatHandler);

export default router;
