import React from "react";
import { ChevronRight } from "lucide-react";
import { STATUSES, STATUS_LABELS, STATUS_COLOR_KEY } from "../../data/mockData.js";

const HEX = {
  new: "#64748B", contacted: "#3B82F6", interested: "#8B5CF6", highly: "#B08D57",
  qualified: "#0D9488", converted: "#16A34A", notinterested: "#94A3B8", lost: "#DC2626",
};

const PIPELINE_STAGES = ["NEW", "CONTACTED", "INTERESTED", "HIGHLY_INTERESTED", "QUALIFIED", "CONVERTED"];

export default function Pipeline({ leads }) {
  const total = leads.length || 1;
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <h3 className="font-display text-sm font-semibold text-ink-900">Sales Pipeline</h3>
        <p className="text-xs text-ink-400">Lead progression from first contact to conversion</p>
      </div>
      <div className="flex flex-col gap-1 md:flex-row md:items-stretch md:gap-2">
        {PIPELINE_STAGES.map((stage, i) => {
          const count = leads.filter((l) => l.status === stage).length;
          const pct = Math.round((count / total) * 100);
          const hex = HEX[STATUS_COLOR_KEY[stage]];
          return (
            <React.Fragment key={stage}>
              <div className="flex-1 rounded-xl border border-ink-50 bg-ink-50/40 p-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{STATUS_LABELS[stage]}</p>
                </div>
                <p className="mt-2 font-feature-tnum font-display text-xl font-semibold text-ink-900">{count}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: hex }} />
                </div>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="hidden items-center justify-center text-ink-200 md:flex">
                  <ChevronRight size={16} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
