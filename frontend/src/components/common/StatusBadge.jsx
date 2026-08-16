import React from "react";
import { STATUS_LABELS, STATUS_COLOR_KEY } from "../../data/mockData.js";

const HEX = {
  new: "#64748B",
  contacted: "#3B82F6",
  interested: "#8B5CF6",
  highly: "#B08D57",
  qualified: "#0D9488",
  converted: "#16A34A",
  notinterested: "#94A3B8",
  lost: "#DC2626",
};

export default function StatusBadge({ status, size = "md" }) {
  const key = STATUS_COLOR_KEY[status] || "new";
  const hex = HEX[key];
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide ${pad}`}
      style={{ color: hex, backgroundColor: `${hex}14`, borderColor: `${hex}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
