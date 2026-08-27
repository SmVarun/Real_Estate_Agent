import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "../../constants/index.js";

/*
 * Local to the charts: these are presentation, not data. The status
 * values themselves come from the shared constants module, which
 * mirrors the backend enum.
 */
const STATUS_HEX = {
  NEW: "#64748B",
  CONTACTED: "#3B82F6",
  INTERESTED: "#8B5CF6",
  HIGHLY_INTERESTED: "#B08D57",
  QUALIFIED: "#0D9488",
  CONVERTED: "#16A34A",
  NOT_INTERESTED: "#94A3B8",
  LOST: "#DC2626",
};

export default function LeadStatusChart({ leads }) {
  const data = LEAD_STATUSES.map((status) => ({
    status: LEAD_STATUS_LABELS[status],
    count: leads.filter((lead) => lead.status === status).length,
    color: STATUS_HEX[status],
  }));

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink-900">Lead Status Distribution</h3>
          <p className="text-xs text-ink-400">Current pipeline breakdown</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#EEF0F3" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#93A2C0" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="status"
            width={120}
            tick={{ fontSize: 11.5, fill: "#5E729B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#F7F8FA" }}
            contentStyle={{ borderRadius: 10, border: "1px solid #E4E8F0", fontSize: 12.5 }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
