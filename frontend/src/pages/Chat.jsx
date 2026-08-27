import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Sparkles, Trash2 } from "lucide-react";

import ChatWindow from "../components/chat/ChatWindow.jsx";
import KnowledgePanel from "../components/chat/KnowledgePanel.jsx";
import { sendChatMessage } from "../api/chat.js";
import { ApiError } from "../api/client.js";
import { uid } from "../utils/helpers.js";

/*
 * The AI assistant, backed by the RAG endpoint.
 *
 * IMPORTANT: the backend stores no conversation. POST /api/v1/chat is
 * a single turn — it takes a question and returns an answer, and it
 * carries no history between calls. So this page holds the thread in
 * component state for the current session only. Reloading the page
 * clears it, and that is honest: there is nowhere for it to have been
 * saved.
 *
 * Nothing here fabricates an answer. Every assistant message on screen
 * came from the server.
 */

const SUGGESTIONS = [
  "What are our current commission rates?",
  "Summarise the sales policy for new agents.",
  "What documents does a buyer need to provide?",
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  /*
   * Lets an in-flight question be abandoned when the thread is
   * cleared, so a late response cannot land in an empty transcript.
   */
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text) => {
      const question = text.trim();

      if (!question || pending) {
        return;
      }

      setError(null);

      /*
       * The question goes up immediately — waiting for the server to
       * echo it would leave the input feeling unresponsive for as long
       * as a local model takes to think.
       */
      const userMessage = {
        id: uid("msg"),
        role: "user",
        text: question,
        timestamp: new Date().toISOString(),
      };

      setMessages((current) => [...current, userMessage]);
      setPending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { answer, sources, contextFound } = await sendChatMessage({
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
             * answer, and it is shown as the reply rather than being
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
         * An error is reported as an error. No placeholder reply is
         * inserted — a fake answer would be indistinguishable from a
         * real one.
         */
        setError(
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

  const clearThread = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setError(null);
    setPending(false);
  }, []);

  /* Every distinct document cited so far in this session. */
  const citedSources = messages
    .filter((message) => message.role === "assistant")
    .flatMap((message) => message.sources || []);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] animate-fadeIn overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
      {/* Session panel */}
      <div className="hidden w-[300px] shrink-0 flex-col border-r border-ink-100 md:flex">
        <div className="border-b border-ink-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-800 text-brass-400">
              <Sparkles size={15} />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-ink-900">
                AI Assistant
              </h3>
              <p className="text-xs text-ink-400">Answers from your knowledge base</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
            Try asking
          </p>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => send(suggestion)}
                disabled={pending}
                className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-left text-xs leading-relaxed text-ink-600 transition-colors hover:border-brass-200 hover:bg-brass-50/50 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/*
            Said plainly rather than implied — this thread is not
            stored anywhere, and the UI should not suggest otherwise.
          */}
          <div className="mt-5 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-3 py-3">
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-400">
              <MessageSquare size={12} className="mt-0.5 shrink-0" />
              This conversation is not saved. Each question is answered on its
              own and the thread clears when you leave the page.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="border-t border-ink-100 p-3">
            <button
              onClick={clearThread}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-ink-400 transition-colors hover:bg-ink-50 hover:text-red-500"
            >
              <Trash2 size={13} /> Clear conversation
            </button>
          </div>
        )}
      </div>

      {/* Thread */}
      <div className="min-w-0 flex-1">
        <ChatWindow
          messages={messages}
          pending={pending}
          error={error}
          onSend={send}
          onDismissError={() => setError(null)}
        />
      </div>

      {/* Sources */}
      <div className="w-[280px] shrink-0">
        <KnowledgePanel sources={citedSources} />
      </div>
    </div>
  );
}

export { SUGGESTIONS };
