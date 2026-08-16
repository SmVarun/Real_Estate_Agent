import React, { useState } from "react";
import { Menu, Search, Bell, Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCrm } from "../../context/CrmContext.jsx";
import { timeAgo } from "../../utils/helpers.js";
import Button from "../common/Button.jsx";

export default function Topbar({ onMenuClick, onQuickAdd }) {
  const { notifications, markNotificationsRead } = useCrm();
  const [notifOpen, setNotifOpen] = useState(false);
  const [range, setRange] = useState("Last 30 days");
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-white/85 px-4 py-3 backdrop-blur-md lg:px-6">
      <button className="rounded-lg p-2 text-ink-500 hover:bg-ink-50 lg:hidden" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="relative hidden max-w-sm flex-1 items-center md:flex">
        <Search size={16} className="pointer-events-none absolute left-3 text-ink-300" />
        <input
          placeholder="Search leads, salespeople, properties…"
          className="w-full rounded-lg border border-ink-100 bg-ink-50/60 py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-300 outline-none transition-colors focus:border-brass-300 focus:bg-white focus:ring-2 focus:ring-brass-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="hidden items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-xs font-medium text-ink-500 hover:bg-ink-50 sm:flex"
        >
          <Calendar size={14} />
          {range}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              if (!notifOpen) markNotificationsRead();
            }}
            className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-50"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brass-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-80 animate-fadeIn rounded-xl border border-ink-100 bg-white shadow-pop">
                <div className="border-b border-ink-100 px-4 py-3">
                  <p className="font-display text-sm font-semibold text-ink-900">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className="border-b border-ink-50 px-4 py-3 last:border-0 hover:bg-ink-50/60">
                      <p className="text-sm text-ink-700">{n.text}</p>
                      <p className="mt-1 text-xs text-ink-300">{n.minutesAgo != null ? `${n.minutesAgo}m ago` : timeAgo(n.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Button variant="brass" size="sm" icon={Plus} onClick={onQuickAdd}>
          <span className="hidden sm:inline">Add Lead</span>
        </Button>
      </div>
    </header>
  );
}
