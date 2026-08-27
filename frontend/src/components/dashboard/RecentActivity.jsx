import React from "react";
import { UserPlus, MessageSquareText, ArrowRightLeft, StickyNote, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { timeAgo } from "../../utils/helpers.js";

/*
 * Keys are the backend LEAD_ACTIVITY_TYPES values, which is what the
 * activity feed actually returns.
 */
const ICONS = {
  created: UserPlus,
  status: TrendingUp,
  assign: ArrowRightLeft,
  note: StickyNote,
  updated: MessageSquareText,
};

const COLORS = {
  created: "text-blue-600 bg-blue-50",
  status: "text-brass-600 bg-brass-50",
  assign: "text-ink-600 bg-ink-100",
  note: "text-ink-500 bg-ink-50",
  updated: "text-violet-600 bg-violet-50",
};

export default function RecentActivity({ activity, loading, error }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold text-ink-900">Recent Activity</h3>
        <p className="text-xs text-ink-400">Live feed across your pipeline</p>
      </div>
      <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
        {loading ? (
          <p className="py-6 text-center text-sm text-ink-400">Loading activity…</p>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-500">{error}</p>
        ) : activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            No activity yet. It will appear here as leads move through the pipeline.
          </p>
        ) : (
          activity.slice(0, 12).map((entry) => {
            const Icon = ICONS[entry.type] || TrendingUp;

            return (
              <Link
                key={entry.id}
                to={`/leads/${entry.leadId}`}
                className="flex items-start gap-3 rounded-lg transition-colors hover:bg-ink-50/60"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    COLORS[entry.type] || COLORS.status
                  }`}
                >
                  <Icon size={13} />
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <p className="text-sm leading-snug text-ink-700">
                    <span className="font-medium">{entry.leadName}</span> — {entry.text}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-300">{timeAgo(entry.timestamp)}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
