import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

import ChatWindow from "../components/chat/ChatWindow.jsx";
import QualificationForm from "../components/chat/QualificationForm.jsx";
import {
  qualifyLead,
  sendPublicChatMessage,
  getChatSession,
} from "../api/qualification.js";
import { ApiError } from "../api/client.js";
import { uid } from "../utils/helpers.js";

/*
 * The PUBLIC property assistant — the page a prospective buyer lands
 * on. It is not part of the CRM: there is no AppShell, no sidebar and
 * no authenticated user behind it.
 *
 * The order matters and is the whole point of the page:
 *
 *   qualification form -> real CRM lead -> assistant
 *
 * The assistant is never asked to collect a name, a phone number or a
 * location. Those are captured by the form above, validated on the
 * server, and written to the CRM before a single question is answered.
 * Once past the gate the model does exactly one job: answer property
 * questions from the knowledge base.
 *
 * Nothing here fabricates anything. If qualification fails, no lead is
 * pretended into existence and the gate stays shut. If a question
 * fails, the error is shown rather than an invented reply.
 */

export default function PublicChat() {
  /*
   * The session's own state. Note what is NOT here: no lead id, no
   * salesperson id, no token. The enquiry is identified by an httpOnly
   * cookie the server issued, which this code cannot read and does not
   * need to — so there is nothing sensitive in component state and
   * nothing written to localStorage.
   */
  const [session, setSession] = useState({
    qualificationComplete: false,
    name: null,
    advisor: null,
  });

  /* Until the cookie has been checked, showing either view would guess. */
  const [restoring, setRestoring] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [qualifyError, setQualifyError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [chatError, setChatError] = useState(null);

  const abortRef = useRef(null);

  /*
   * A refresh should not show the form again to somebody who has
   * already filled it in, and — more importantly — should not create a
   * second lead. The session cookie survives the reload, so ask the
   * server who this browser is before rendering either view.
   */
  useEffect(() => {
    const controller = new AbortController();

    getChatSession({ signal: controller.signal })
      .then((data) => setSession(data))
      .catch(() => {
        /*
         * The backend being unreachable is not a reason to claim the
         * visitor has not qualified — it just means we do not know.
         * Showing the form is the safe default: submitting it reuses
         * the existing lead rather than duplicating it.
         */
      })
      .finally(() => setRestoring(false));

    return () => controller.abort();
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleQualify = useCallback(
    async (values) => {
      if (submitting) {
        return;
      }

      setSubmitting(true);
      setQualifyError(null);

      try {
        const data = await qualifyLead(values);

        setSession(data);

        /*
         * A greeting, not a fabricated answer — it is written here and
         * marked as such, and no `sources` are attached to it because
         * it did not come from the knowledge base.
         */
        setMessages([
          {
            id: uid("msg"),
            role: "assistant",
            text: data.advisor?.firstName
              ? `Thanks, ${data.name}! You're all set. ${data.advisor.firstName} from our team will follow up with you shortly. In the meantime, ask me anything about our properties.`
              : `Thanks, ${data.name}! You're all set. You can now ask me anything about our properties.`,
            sources: [],
            contextFound: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (caught) {
        /*
         * Field-level messages from the backend's Zod handler are
         * surfaced; anything else falls back to its message. Under no
         * circumstance is the gate opened on a failure.
         */
        const fieldMessage =
          caught instanceof ApiError && caught.fieldErrors
            ? Object.values(caught.fieldErrors)[0]
            : null;

        setQualifyError(
          fieldMessage ||
            (caught instanceof ApiError
              ? caught.message
              : "Unable to submit your details right now. Please try again.")
        );
      } finally {
        setSubmitting(false);
      }
    },
    [submitting]
  );

  const send = useCallback(
    async (text) => {
      const question = text.trim();

      if (!question || pending) {
        return;
      }

      setChatError(null);

      setMessages((current) => [
        ...current,
        {
          id: uid("msg"),
          role: "user",
          text: question,
          timestamp: new Date().toISOString(),
        },
      ]);

      setPending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { answer, sources, contextFound } = await sendPublicChatMessage({
          message: question,
          signal: controller.signal,
        });

        setMessages((current) => [
          ...current,
          {
            id: uid("msg"),
            role: "assistant",
            /*
             * Rendered exactly as returned. When contextFound is false
             * this is the backend's own "not in the knowledge base"
             * refusal, and it is shown as the reply rather than being
             * swapped for something more confident.
             */
            text: answer,
            sources: sources || [],
            contextFound,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (caught) {
        if (caught?.name === "AbortError") {
          return;
        }

        /*
         * A 401 here means the session cookie expired or was cleared
         * mid-conversation. Send them back to the form rather than
         * leaving them typing into a chat that cannot answer.
         */
        if (caught instanceof ApiError && caught.isUnauthorized) {
          setSession({
            qualificationComplete: false,
            name: null,
            advisor: null,
          });
          setMessages([]);
          setQualifyError(
            "Your session expired. Please share your details again to continue."
          );
          return;
        }

        setChatError(
          caught instanceof ApiError
            ? caught.message
            : "The assistant could not answer that. Please try again."
        );
      } finally {
        setPending(false);
        abortRef.current = null;
      }
    },
    [pending]
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-4 py-3.5 sm:px-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-brass-400">
            <Sparkles size={15} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-ink-900">
              Property Assistant
            </p>
            <p className="truncate text-xs text-ink-400">
              Ask about our listings, pricing and process
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="h-[calc(100vh-9.5rem)] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          {restoring ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-2 w-2 animate-pulseSoft rounded-full bg-ink-300"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : session.qualificationComplete ? (
            <ChatWindow
              messages={messages}
              pending={pending}
              error={chatError}
              onSend={send}
              onDismissError={() => setChatError(null)}
              title="Property Assistant"
              subtitle="Answers based on our published property information"
              emptyTitle="Ask us anything"
              emptyDescription="Questions are answered from our published property documents. If we don't have the answer on file, we'll say so rather than guess."
              placeholder="Ask about our properties…"
            />
          ) : (
            <QualificationForm
              onSubmit={handleQualify}
              submitting={submitting}
              error={qualifyError}
            />
          )}
        </div>

        {/*
          Said plainly. The visitor's details are in the CRM; the
          conversation itself is not stored anywhere, and the page
          should not imply that it is.
        */}
        {session.qualificationComplete && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-400">
            <ShieldCheck size={12} className="shrink-0" />
            Answers come from our published documents. This conversation is not
            saved.
          </p>
        )}
      </main>
    </div>
  );
}
