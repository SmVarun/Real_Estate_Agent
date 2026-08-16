import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { classNames } from "../../utils/helpers.js";

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, accent = "ink", onClick }) {
  const positive = trend >= 0;
  const ACCENTS = {
    ink: "bg-ink-50 text-ink-700",
    brass: "bg-brass-50 text-brass-600",
  };
  return (
    <button
      onClick={onClick}
      className={classNames(
        "group flex flex-col rounded-2xl border border-ink-100 bg-white p-5 text-left shadow-soft transition-all",
        onClick && "hover:-translate-y-0.5 hover:shadow-card cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={classNames("flex h-9 w-9 items-center justify-center rounded-lg", ACCENTS[accent])}>
          <Icon size={17} strokeWidth={2} />
        </div>
        {trend != null && (
          <span className={classNames("flex items-center gap-0.5 text-xs font-semibold", positive ? "text-emerald-600" : "text-red-500")}>
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 font-feature-tnum font-display text-[26px] font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-ink-400">{label}</p>
      {trendLabel && <p className="mt-2 text-[11px] text-ink-300">{trendLabel}</p>}
    </button>
  );
}
