import { z } from "zod";

import {
  DEFAULT_TOP_K,
  MAX_TOP_K,
} from "../services/rag-retrieval.service.js";

/*
 * topK is the only knob the frontend may turn, and only inside a
 * narrow band — it maps straight onto a vector-database query cost and
 * onto the prompt size sent to the local model.
 */
const chatMessageSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message must be 2000 characters or fewer"),

  topK: z
    .number()
    .int("topK must be an integer")
    .min(1, `topK must be between 1 and ${MAX_TOP_K}`)
    .max(MAX_TOP_K, `topK must be between 1 and ${MAX_TOP_K}`)
    .optional()
    .default(DEFAULT_TOP_K),
});

export { chatMessageSchema };
