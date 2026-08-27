import { api } from "./client.js";

/*
 * The PUBLIC client chat: /api/v1/chat/qualify, /chat/public and
 * /chat/session.
 *
 * Kept apart from api/chat.js on purpose. That module talks to the
 * authenticated CRM assistant; this one is for an anonymous visitor
 * who has no account. Mixing them would make it easy to call the wrong
 * one from the wrong page.
 *
 * None of these ever send or receive a lead id. The visitor's enquiry
 * is identified by an httpOnly cookie the server issues, which the
 * shared client already forwards via credentials: "include" — so there
 * is nothing here for the browser to hold, store or leak.
 */

/*
 * Create the lead. The server decides the source, the status and the
 * salesperson; all we may send are the three fields the visitor typed.
 *
 * Returns { qualificationComplete, name, advisor } where `advisor` is
 * either null or { firstName } — a friendly label, never an id.
 */
export const qualifyLead = async ({
  name,
  contact,
  preferredLocation,
  signal,
} = {}) => {
  const response = await api.post(
    "/api/v1/chat/qualify",
    { name, contact, preferredLocation },
    { signal }
  );

  return response.data;
};

/*
 * One question for a visitor who has already qualified.
 *
 * Same contract as the authenticated chat — { answer, sources,
 * contextFound } — because it is the same RAG pipeline behind it.
 * `contextFound: false` means the knowledge base had nothing relevant
 * and `answer` is the backend's own refusal; show it as-is.
 */
export const sendPublicChatMessage = async ({ message, signal } = {}) => {
  const response = await api.post(
    "/api/v1/chat/public",
    { message },
    { signal }
  );

  return response.data;
};

/*
 * Has this browser already qualified?
 *
 * Called once when the public chat mounts, so a reload does not show
 * the form again to somebody who has already filled it in. The answer
 * comes from the session cookie, so it survives a refresh without
 * anything being written to localStorage.
 */
export const getChatSession = async ({ signal } = {}) => {
  const response = await api.get("/api/v1/chat/session", { signal });
  return response.data;
};
