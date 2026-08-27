import {
  qualificationSchema,
  publicChatMessageSchema,
} from "../validator/qualification.validator.js";

import {
  qualifyLead,
  findLeadByChatSession,
  touchLeadInteraction,
  toPublicAdvisor,
} from "../services/lead-qualification.service.js";

import User from "../models/user.model.js";

import { answerQuestion } from "../services/chat.service.js";

import {
  readChatSessionId,
  setChatSessionCookie,
} from "../utils/chat-session.js";

/*
 * HTTP edge for the PUBLIC client chat.
 *
 * These are the only two handlers in the application reachable without
 * a session, so the response shapes here are deliberately minimal.
 * Nothing internal leaves this file: no lead id, no salesperson id, no
 * email, no status, no assignment reasoning. The visitor learns that
 * their enquiry was received and, at most, the first name of the
 * person who will call them.
 */

/*
 * POST /api/v1/chat/qualify
 *
 * Collects name, contact and preferred location, creates the lead and
 * assigns it — then hands the browser a session cookie so the chat
 * that follows can be tied back to that lead without the client ever
 * holding an id.
 */
export const qualifyHandler = async (req, res, next) => {
  try {
    const { name, contact, preferredLocation } = qualificationSchema.parse(
      req.body
    );

    /*
     * A cookie this browser already has. It is the first thing the
     * service checks, which is what makes a refresh or a double
     * submit reuse the existing lead instead of creating another.
     */
    const existingSessionId = readChatSessionId(req);

    const { lead, sessionId, advisor } = await qualifyLead({
      name,
      contact,
      preferredLocation,
      existingSessionId,
    });

    setChatSessionCookie(res, sessionId);

    /*
     * Note what is absent: leadId, the assignee's id, and whether
     * assignment succeeded at all. A visitor whose lead could not be
     * assigned sees exactly what an assigned one sees — an internal
     * staffing problem is not their business, and the lead is in the
     * CRM either way.
     */
    return res.status(201).json({
      success: true,
      message: "Thanks — your enquiry has been received.",
      data: {
        qualificationComplete: true,
        /*
         * The name on the LEAD, not the one just submitted. When an
         * existing enquiry was reused they can differ ("Rahul S" vs
         * "Rahul Sharma"), and the greeting should match the record a
         * salesperson will actually be calling.
         */
        name: lead.name,
        advisor,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/v1/chat/public
 *
 * One RAG turn for a qualified visitor. Same retrieval, same prompt,
 * same grounding rules and the same hard refusal as the authenticated
 * endpoint — the only difference is who is allowed to ask.
 */
export const publicChatHandler = async (req, res, next) => {
  try {
    const { message } = publicChatMessageSchema.parse(req.body);

    /*
     * Authorization for an anonymous caller.
     *
     * The lead is resolved from the httpOnly session cookie, which the
     * server issued and page JavaScript cannot read. The request body
     * carries no lead id, so there is nothing for a caller to swap in
     * order to reach somebody else's enquiry. No valid session means
     * no qualification, and the assistant does not answer.
     */
    const sessionId = readChatSessionId(req);
    const lead = await findLeadByChatSession(sessionId);

    if (!lead) {
      const error = new Error(
        "Please share your details before starting the chat."
      );
      error.statusCode = 401;
      throw error;
    }

    /*
     * The lead's own details are deliberately NOT added to the prompt.
     * The knowledge base answers property questions; putting a
     * visitor's name and phone number into the retrieval context would
     * both pollute the grounding and risk it being echoed back.
     */
    const { answer, sources, contextFound } = await answerQuestion({
      message,
    });

    await touchLeadInteraction(lead._id);

    return res.status(200).json({
      success: true,
      data: {
        answer,
        sources,
        contextFound,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/v1/chat/session
 *
 * Lets a returning browser find out whether it has already qualified,
 * so a reload lands straight in the chat rather than showing the form
 * to somebody who has already filled it in.
 *
 * Returns only a boolean and a display name — never the lead itself.
 */
export const chatSessionHandler = async (req, res, next) => {
  try {
    const sessionId = readChatSessionId(req);
    const lead = await findLeadByChatSession(sessionId);

    if (!lead) {
      return res.status(200).json({
        success: true,
        data: { qualificationComplete: false, name: null, advisor: null },
      });
    }

    /*
     * Read fresh from the lead rather than remembered on the session,
     * so a reassignment made in the CRM is reflected the next time the
     * visitor comes back.
     */
    const assignee = lead.assignedTo
      ? await User.findById(lead.assignedTo).select("name")
      : null;

    return res.status(200).json({
      success: true,
      data: {
        qualificationComplete: true,
        name: lead.name,
        advisor: toPublicAdvisor(assignee),
      },
    });
  } catch (error) {
    next(error);
  }
};
