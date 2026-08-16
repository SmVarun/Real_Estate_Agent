import React from "react";
import { Bot, Check, CheckCheck } from "lucide-react";
import { classNames } from "../../utils/helpers.js";

export default function MessageBubble({ message }) {
  const isLead = message.sender === "lead";
  const time = new Date(message.timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  return (
    <div className={classNames("flex items-end gap-2", isLead ? "justify-start" : "justify-end")}>
      {!isLead && (
        <div className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-800 text-brass-400">
          <Bot size={12} />
        </div>
      )}
      <div
        className={classNames(
          "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
          isLead ? "rounded-bl-sm bg-white border border-ink-100 text-ink-700" : "rounded-br-sm bg-ink-800 text-white"
        )}
      >
        <p>{message.text}</p>
        <div className={classNames("mt-1 flex items-center gap-1 text-[10px]", isLead ? "text-ink-300" : "text-white/50")}>
          {time}
          {!isLead && <CheckCheck size={12} className="text-brass-300" />}
        </div>
      </div>
    </div>
  );
}
