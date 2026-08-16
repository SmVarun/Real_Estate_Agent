import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { STATUSES, STATUS_LABELS, STATUS_COLOR_KEY } from "../../data/mockData.js";

const HEX = {
  new: "#64748B", contacted: "#3B82F6", interested: "#8B5CF6", highly: "#B08D57",
  qualified: "#0D9488", converted: "#16A34A", notinterested: "#94A3B8", lost: "#DC2626",
};

export default function LeadStatusChart({ leads }) {
  const data = STATUSES.map((s) => ({
    status: STATUS_LABELS[s],
    count: leads.filter((l) => l.status === s).length,
    color: HEX[STATUS_COLOR_KEY[s]],
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
