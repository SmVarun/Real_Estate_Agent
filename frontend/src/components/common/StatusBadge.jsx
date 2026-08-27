import React from "react";
import { LEAD_STATUS_LABELS } from "../../constants/index.js";

/*
 * Presentation for the backend's lead status enum. The values are
 * defined once in constants/index.js, which mirrors the server; the
 * colours are local to this component.
 */
const HEX = {
  NEW: "#64748B",
  CONTACTED: "#3B82F6",
  INTERESTED: "#8B5CF6",
  HIGHLY_INTERESTED: "#B08D57",
  QUALIFIED: "#0D9488",
  CONVERTED: "#16A34A",
  NOT_INTERESTED: "#94A3B8",
  LOST: "#DC2626",
};

export default function StatusBadge({ status, size = "md" }) {
  const hex = HEX[status] || HEX.NEW;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide ${pad}`}
      style={{ color: hex, backgroundColor: `${hex}14`, borderColor: `${hex}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {LEAD_STATUS_LABELS[status] || status}
    </span>
  );
}
