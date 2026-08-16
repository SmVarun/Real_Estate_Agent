import React, { useState } from "react";
import ConversationList from "../components/chat/ConversationList.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import LeadInfoPanel from "../components/chat/LeadInfoPanel.jsx";
import { useCrm } from "../context/CrmContext.jsx";

export default function Chat() {
  const { conversations, leads } = useCrm();
  const [activeId, setActiveId] = useState(conversations[0]?.id || null);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const activeLead = activeConversation ? leads.find((l) => l.id === activeConversation.leadId) : null;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] animate-fadeIn overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="hidden w-[300px] shrink-0 border-r border-ink-100 md:block">
        <ConversationList conversations={conversations} leads={leads} activeId={activeId} onSelect={setActiveId} />
      </div>
      <div className="min-w-0 flex-1">
        <ChatWindow conversation={activeConversation} lead={activeLead} />
      </div>
      <div className="w-[280px] shrink-0">
        <LeadInfoPanel lead={activeLead} />
      </div>
    </div>
  );
}
