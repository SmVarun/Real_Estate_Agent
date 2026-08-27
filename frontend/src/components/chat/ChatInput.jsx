import React, { useState } from "react";
import { SendHorizontal } from "lucide-react";

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask about your documents…",
}) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-ink-100 bg-white px-4 py-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={disabled ? "Waiting for a response…" : placeholder}
        className="flex-1 rounded-full border border-ink-100 bg-ink-50/60 px-4 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 outline-none focus:border-brass-300 focus:bg-white focus:ring-2 focus:ring-brass-100 disabled:opacity-60"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-800 text-white transition-colors hover:bg-ink-900 disabled:opacity-40"
      >
        <SendHorizontal size={17} />
      </button>
    </div>
  );
}
