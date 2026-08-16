import React from "react";
import { UserPlus, MessageSquareText, ArrowRightLeft, CheckCircle2, StickyNote, XCircle, TrendingUp } from "lucide-react";
import { timeAgo } from "../../utils/helpers.js";

const ICONS = {
  status: TrendingUp,
  lead: UserPlus,
  message: MessageSquareText,
  assign: ArrowRightLeft,
  convert: CheckCircle2,
  note: StickyNote,
  lost: XCircle,
};

const COLORS = {
  status: "text-brass-600 bg-brass-50",
  lead: "text-blue-600 bg-blue-50",
  message: "text-violet-600 bg-violet-50",
  assign: "text-ink-600 bg-ink-100",
  convert: "text-emerald-600 bg-emerald-50",
  note: "text-ink-500 bg-ink-50",
  lost: "text-red-500 bg-red-50",
};

export default function RecentActivity({ activity }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold text-ink-900">Recent Activity</h3>
        <p className="text-xs text-ink-400">Live feed across your pipeline</p>
      </div>
      <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
        {activity.slice(0, 12).map((a) => {
          const Icon = ICONS[a.type] || TrendingUp;
          return (
            <div key={a.id} className="flex items-start gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${COLORS[a.type] || COLORS.status}`}>
                <Icon size={13} />
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm leading-snug text-ink-700">{a.text}</p>
                <p className="mt-0.5 text-xs text-ink-300">
                  {a.minutesAgo != null ? `${a.minutesAgo < 60 ? a.minutesAgo + "m" : Math.floor(a.minutesAgo / 60) + "h"} ago` : timeAgo(a.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
