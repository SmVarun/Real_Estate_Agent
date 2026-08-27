import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LEAD_SOURCES } from "../../constants/index.js";

const PALETTE = ["#14213D", "#B08D57", "#3D5079", "#0D9488", "#8B5CF6", "#3B82F6", "#C29F6B", "#93A2C0"];

export default function LeadSourceChart({ leads }) {
  const data = LEAD_SOURCES.map((source, index) => ({
    name: source,
    value: leads.filter((lead) => lead.source === source).length,
    color: PALETTE[index % PALETTE.length],
  })).filter((slice) => slice.value > 0);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="mb-2">
        <h3 className="font-display text-sm font-semibold text-ink-900">Lead Sources</h3>
        <p className="text-xs text-ink-400">Where opportunities originate</p>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center">
          <p className="text-sm text-ink-400">No lead sources to show yet.</p>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E4E8F0", fontSize: 12.5 }} />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(v) => <span style={{ color: "#5E729B", fontSize: 11.5 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
