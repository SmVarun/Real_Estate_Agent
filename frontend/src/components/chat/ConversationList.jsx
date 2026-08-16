import React from "react";
import Avatar from "../common/Avatar.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import { timeAgo, classNames } from "../../utils/helpers.js";

export default function ConversationList({ conversations, leads, activeId, onSelect }) {
  const leadMap = Object.fromEntries(leads.map((l) => [l.id, l]));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-100 px-4 py-4">
        <h3 className="font-display text-sm font-semibold text-ink-900">Conversations</h3>
        <p className="text-xs text-ink-400">{conversations.length} active threads</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c) => {
          const lead = leadMap[c.leadId];
          if (!lead) return null;
          const last = c.messages[c.messages.length - 1];
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={classNames(
                "flex w-full items-start gap-3 border-b border-ink-50 px-4 py-3.5 text-left transition-colors",
                activeId === c.id ? "bg-brass-50" : "hover:bg-ink-50/60"
              )}
            >
              <Avatar name={lead.name} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink-800">{lead.name}</p>
                  <span className="shrink-0 text-[10.5px] text-ink-300">{timeAgo(last?.timestamp)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-400">{last?.text}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <StatusBadge status={lead.status} size="sm" />
                  {c.unread > 0 && (
                    <span className="ml-auto flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brass-500 px-1 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
