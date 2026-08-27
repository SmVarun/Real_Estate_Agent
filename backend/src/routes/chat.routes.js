import express from "express";

import { chatHandler } from "../controllers/chat.controller.js";

import {
  qualifyHandler,
  publicChatHandler,
  chatSessionHandler,
} from "../controllers/qualification.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";

const router = express.Router();

/*
 * ---------------------------------------------------------------
 * PUBLIC — no session required.
 *
 * These three are the client-facing chat: a visitor qualifies, then
 * asks the assistant questions. They are declared BEFORE the
 * requireAuth guard below, because router.use() applies to everything
 * registered after it and would otherwise lock these too.
 *
 * They are rate limited precisely because they are public. The
 * authenticated CRM routes are not, and are unaffected.
 * ---------------------------------------------------------------
 */

/*
 * Qualification writes a real lead to the database, so it is the
 * tightest limit here — enough for a person who mistypes their number
 * a few times, not enough to seed the CRM with junk.
 */
router.post(
  "/qualify",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message:
      "Too many enquiries from this connection. Please try again shortly.",
  }),
  qualifyHandler
);

/*
 * Each public question costs an embedding, a vector query and a local
 * LLM generation, so the limit here is about protecting the model
 * rather than the database.
 */
router.post(
  "/public",
  rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: "You are sending messages too quickly. Please wait a moment.",
  }),
  publicChatHandler
);

/* A cheap cookie lookup — limited only to stop it being used as a probe. */
router.get(
  "/session",
  rateLimit({ windowMs: 5 * 60 * 1000, max: 60 }),
  chatSessionHandler
);

/*
 * ---------------------------------------------------------------
 * AUTHENTICATED — the CRM's own assistant, unchanged.
 *
 * Authenticated users of every role may query the knowledge base —
 * uploading documents is the admin-only action, reading them is not.
 * ---------------------------------------------------------------
 */
router.use(requireAuth);

router.post("/", chatHandler);

export default router;
