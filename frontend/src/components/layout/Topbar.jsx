import React, { useMemo, useState } from "react";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCrm } from "../../context/CrmContext.jsx";
import { timeAgo } from "../../utils/helpers.js";
import Button from "../common/Button.jsx";

export default function Topbar({ onMenuClick, onQuickAdd }) {
  /*
   * Notifications are the real lead activity feed. There is no
   * notification API and no read/unread state on the server, so
   * "seen" is tracked here for this session only — it deliberately
   * does not pretend to persist.
   */
  const { activity, loading, leads } = useCrm();
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const unreadCount = Math.max(activity.length - seenCount, 0);

  /*
   * Search is over the leads already loaded — there is no global
   * search endpoint, so it does not claim to cover anything else.
   */
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (term.length < 2) {
      return [];
    }

    return leads
      .filter(
        (lead) =>
          lead.name.toLowerCase().includes(term) ||
          (lead.phone || "").includes(term) ||
          (lead.email || "").toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [query, leads]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-white/85 px-4 py-3 backdrop-blur-md lg:px-6">
      <button className="rounded-lg p-2 text-ink-500 hover:bg-ink-50 lg:hidden" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="relative hidden max-w-sm flex-1 items-center md:flex">
        <Search size={16} className="pointer-events-none absolute left-3 text-ink-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leads by name, phone or email…"
          className="w-full rounded-lg border border-ink-100 bg-ink-50/60 py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-300 outline-none transition-colors focus:border-brass-300 focus:bg-white focus:ring-2 focus:ring-brass-100"
        />
        {query.trim().length >= 2 && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setQuery("")} />
            <div className="absolute left-0 top-11 z-40 w-full animate-fadeIn rounded-xl border border-ink-100 bg-white py-1.5 shadow-pop">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-400">No matching leads.</p>
              ) : (
                results.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      navigate(`/leads/${lead.id}`);
                      setQuery("");
                    }}
                    className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-ink-50"
                  >
                    <span className="text-sm font-medium text-ink-800">{lead.name}</span>
                    <span className="text-xs text-ink-400">{lead.phone}</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              if (!notifOpen) setSeenCount(activity.length);
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
                  {loading.activity ? (
                    <p className="px-4 py-4 text-sm text-ink-400">Loading activity…</p>
                  ) : activity.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-ink-400">No activity yet.</p>
                  ) : (
                    activity.slice(0, 8).map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => {
                          navigate(`/leads/${entry.leadId}`);
                          setNotifOpen(false);
                        }}
                        className="block w-full border-b border-ink-50 px-4 py-3 text-left last:border-0 hover:bg-ink-50/60"
                      >
                        <p className="text-sm text-ink-700">
                          {entry.leadName} — {entry.text}
                        </p>
                        <p className="mt-1 text-xs text-ink-300">{timeAgo(entry.timestamp)}</p>
                      </button>
                    ))
                  )}
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
