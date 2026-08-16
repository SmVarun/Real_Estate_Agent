import React from "react";
import { Search, X } from "lucide-react";
import { STATUSES, STATUS_LABELS, SOURCES } from "../../data/mockData.js";
import { useCrm } from "../../context/CrmContext.jsx";

export default function LeadFilters({ filters, setFilters }) {
  const { salespeople } = useCrm();
  const selectClass =
    "rounded-lg border border-ink-100 bg-white px-3 py-2 text-xs font-medium text-ink-600 outline-none focus:border-brass-300 focus:ring-2 focus:ring-brass-100";

  function update(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const active =
    filters.status !== "ALL" || filters.source !== "ALL" || filters.assignedTo !== "ALL" || filters.query;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          value={filters.query}
          onChange={(e) => update("query", e.target.value)}
          placeholder="Search by name, phone or email…"
          className="w-full rounded-lg border border-ink-100 bg-ink-50/60 py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-300 outline-none focus:border-brass-300 focus:bg-white focus:ring-2 focus:ring-brass-100"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className={selectClass} value={filters.status} onChange={(e) => update("status", e.target.value)}>
          <option value="ALL">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className={selectClass} value={filters.source} onChange={(e) => update("source", e.target.value)}>
          <option value="ALL">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectClass} value={filters.assignedTo} onChange={(e) => update("assignedTo", e.target.value)}>
          <option value="ALL">All Salespeople</option>
          <option value="UNASSIGNED">Unassigned</option>
          {salespeople.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {active && (
          <button
            onClick={() => setFilters({ query: "", status: "ALL", source: "ALL", assignedTo: "ALL" })}
            className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-400 hover:bg-ink-50 hover:text-ink-700"
          >
            <X size={13} /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
