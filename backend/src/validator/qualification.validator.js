import { z } from "zod";

import { isValidPhone } from "../utils/phone.js";

/*
 * The three fields a visitor must give before the assistant will talk
 * to them, validated on the SERVER.
 *
 * The form validates the same rules in the browser, but that is a
 * courtesy to the person typing — this schema is the one that decides.
 * Anything the qualification endpoint accepts becomes a real CRM lead
 * that a salesperson will try to call, so the bar is set at "could a
 * human actually follow this up".
 *
 * Zod strips unknown keys, so a caller sending source, status or
 * assignedTo has them silently discarded here — the service sets all
 * three itself.
 */
const qualificationSchema = z.object({
  name: z
    .string({ message: "Please enter your name." })
    .trim()
    .min(2, "Please enter your full name.")
    .max(100, "Name cannot exceed 100 characters.")
    /*
     * A name has at least one letter in it. This rejects "123" and
     * "...." without trying to police what a name may contain —
     * unicode letters, marks, spaces and punctuation all pass.
     */
    .refine((value) => /\p{L}/u.test(value), "Please enter a valid name."),

  contact: z
    .string({ message: "Please enter your phone number." })
    .trim()
    .min(1, "Please enter your phone number.")
    .max(20, "Please enter a valid phone number.")
    .refine(isValidPhone, "Please enter a valid phone number."),

  preferredLocation: z
    .string({ message: "Please enter your preferred location." })
    .trim()
    .min(2, "Please enter your preferred location.")
    .max(150, "Location cannot exceed 150 characters."),
});

/*
 * The public chat turn. Deliberately identical to the authenticated
 * chat's message rules — a public visitor gets the same assistant, not
 * a different one — but it carries no leadId. The lead is resolved
 * from the session cookie, never from the body.
 */
const publicChatMessageSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message must be 2000 characters or fewer"),
});

export { qualificationSchema, publicChatMessageSchema };
