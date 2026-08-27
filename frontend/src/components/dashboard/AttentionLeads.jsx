import React from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import Avatar from "../common/Avatar.jsx";
import Button from "../common/Button.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { useCrm } from "../../context/CrmContext.jsx";

export default function AttentionLeads({ leads, onAssign }) {
  const { canAssign } = useCrm();
  const highly = leads
    .filter((lead) => lead.status === "HIGHLY_INTERESTED")
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-brass-200/70 bg-gradient-to-br from-brass-50/60 to-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-500 text-white">
          <Flame size={15} />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-ink-900">Needs Attention</h3>
          <p className="text-xs text-ink-400">Highly interested leads awaiting action</p>
        </div>
      </div>

      {highly.length === 0 ? (
        <EmptyState title="All caught up" description="No highly interested leads need attention right now." />
      ) : (
        <div className="space-y-2.5">
          {highly.map((lead) => {
            const assignee = lead.assignee;
            return (
              <div key={lead.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
                <Link to={`/leads/${lead.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar name={lead.name} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800">{lead.name}</p>
                    <p className="truncate text-xs text-ink-400">
                      {[lead.propertyInterest, lead.location, lead.budget]
                        .filter(Boolean)
                        .join(" · ") || "No details captured"}
                    </p>
                  </div>
                </Link>
                {assignee ? (
                  <span className="shrink-0 text-xs font-medium text-ink-500">
                    Assigned to {assignee.name.split(" ")[0]}
                  </span>
                ) : canAssign ? (
                  <Button variant="brass" size="sm" className="shrink-0" onClick={() => onAssign(lead)}>
                    Assign
                  </Button>
                ) : (
                  <span className="shrink-0 text-xs text-ink-400">Unassigned</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
