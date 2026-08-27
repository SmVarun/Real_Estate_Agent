import React, { useEffect, useRef } from "react";
import { Bot, Sparkles, AlertCircle, X } from "lucide-react";

import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";
import EmptyState from "../common/EmptyState.jsx";

/*
 * The transcript for one assistant session.
 *
 * Purely presentational — it renders what it is given and reports what
 * it is told. It never synthesises a reply.
 */
/*
 * Defaults are the CRM's wording. The public assistant passes its own,
 * because "the documents your team has uploaded" is internal framing
 * that means nothing to a prospective buyer.
 */
export default function ChatWindow({
  messages,
  pending,
  error,
  onSend,
  onDismissError,
  title = "Knowledge Base Assistant",
  subtitle = "Grounded in the documents your team has uploaded",
  emptyTitle = "Ask about your documents",
  emptyDescription = "Questions are answered from the files in your knowledge base. If nothing relevant has been uploaded, the assistant will say so.",
  placeholder,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending, error]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-800 text-brass-400">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {title}
          </p>
          <p className="truncate text-xs text-ink-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface/40 px-5 py-5">
        {messages.length === 0 && !pending ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={Sparkles}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {/*
          A thinking indicator, not a placeholder message. Nothing is
          added to the transcript until the server actually answers.
        */}
        {pending && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-800 text-brass-400">
              <Bot size={12} />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-ink-100 bg-white px-4 py-3 shadow-soft">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-ink-300"
                  style={{ animationDelay: `${index * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/*
          A failure is shown as a failure. The question stays in the
          transcript above so it can be retried by asking again.
        */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
            <p className="flex-1 text-sm leading-relaxed text-red-600">{error}</p>
            <button
              onClick={onDismissError}
              className="shrink-0 rounded p-0.5 text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={onSend} disabled={pending} placeholder={placeholder} />
    </div>
  );
}
