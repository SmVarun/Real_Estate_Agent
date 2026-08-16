import React, { useState } from "react";
import { Paperclip, Smile, SendHorizontal } from "lucide-react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
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
      <button className="rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-600" title="Attach file">
        <Paperclip size={18} />
      </button>
      <button className="rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-600" title="Emoji">
        <Smile size={18} />
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type your message…"
        className="flex-1 rounded-full border border-ink-100 bg-ink-50/60 px-4 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 outline-none focus:border-brass-300 focus:bg-white focus:ring-2 focus:ring-brass-100"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-800 text-white transition-colors hover:bg-ink-900 disabled:opacity-40"
      >
        <SendHorizontal size={17} />
      </button>
    </div>
  );
}
