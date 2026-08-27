import React from "react";
import { Bot, FileText, Info } from "lucide-react";
import { classNames } from "../../utils/helpers.js";

/*
 * One turn of the assistant thread.
 *
 * `message.text` is rendered verbatim — for an assistant turn that is
 * the string the backend returned, including its refusal when the
 * knowledge base had nothing relevant.
 */
export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  const time = new Date(message.timestamp).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  /*
   * Only meaningful on an assistant turn, and only when the backend
   * actually said false — an undefined value is not a refusal.
   */
  const noContext = !isUser && message.contextFound === false;

  const sources = (!isUser && message.sources) || [];

  /*
   * The same document can back several retrieved chunks, so it would
   * otherwise be listed once per chunk.
   */
  const uniqueSources = Array.from(
    new Map(sources.map((source) => [source.source, source])).values()
  );

  return (
    <div className={classNames("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-800 text-brass-400">
          <Bot size={12} />
        </div>
      )}

      <div
        className={classNames(
          "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
          isUser
            ? "rounded-br-sm bg-ink-800 text-white"
            : "rounded-bl-sm border border-ink-100 bg-white text-ink-700"
        )}
      >
        {/* whitespace-pre-wrap: the model's paragraph breaks are meaningful. */}
        <p className="whitespace-pre-wrap">{message.text}</p>

        {noContext && (
          <p className="mt-2 flex items-start gap-1.5 border-t border-ink-50 pt-2 text-[11px] leading-relaxed text-ink-400">
            <Info size={11} className="mt-0.5 shrink-0" />
            Nothing in the knowledge base matched this question. Uploading a
            relevant document will let the assistant answer it.
          </p>
        )}

        {uniqueSources.length > 0 && (
          <div className="mt-2.5 border-t border-ink-50 pt-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-300">
              Sources
            </p>
            <ul className="space-y-1">
              {uniqueSources.map((source, index) => (
                <li
                  key={`${source.documentId ?? "doc"}-${index}`}
                  className="flex items-center gap-1.5 text-[11px] text-ink-500"
                >
                  <FileText size={11} className="shrink-0 text-ink-300" />
                  {/* The document name exactly as the backend reported it. */}
                  <span className="truncate">{source.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className={classNames(
            "mt-1 flex items-center gap-1 text-[10px]",
            isUser ? "text-white/50" : "text-ink-300"
          )}
        >
          {time}
        </div>
      </div>
    </div>
  );
}
