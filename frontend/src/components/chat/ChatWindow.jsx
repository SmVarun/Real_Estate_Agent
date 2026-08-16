import React, { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import Avatar from "../common/Avatar.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { MessageSquare } from "lucide-react";
import { useCrm } from "../../context/CrmContext.jsx";

export default function ChatWindow({ conversation, lead }) {
  const { sendMessage, salespeople } = useCrm();
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const sp = salespeople.find((s) => s.id === lead?.assignedTo);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length, typing]);

  if (!conversation || !lead) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a lead from the left panel to view the conversation." />
      </div>
    );
  }

  function handleSend(text) {
    sendMessage(conversation.id, text);
    setTyping(true);
    setTimeout(() => setTyping(false), 1400);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-3.5">
        <Avatar name={lead.name} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink-900">{lead.name}</p>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-ink-400">Active now</span>
          </div>
          <p className="truncate text-xs text-ink-400">{sp ? `Assigned to ${sp.name}` : "Unassigned"}</p>
        </div>
        <StatusBadge status={lead.status} size="sm" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface/40 px-5 py-5">
        {conversation.messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        {typing && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-800 text-brass-400">
              <Bot size={12} />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-ink-100 bg-white px-4 py-3 shadow-soft">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-ink-300" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
}
