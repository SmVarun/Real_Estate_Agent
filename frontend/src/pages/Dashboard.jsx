import React, { useState } from "react";
import { Users, UserPlus, Heart, Flame, BadgeCheck, Trophy, UserRound, UserX } from "lucide-react";
import PageHeader from "../components/layout/PageHeader.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import LeadStatusChart from "../components/dashboard/LeadStatusChart.jsx";
import LeadSourceChart from "../components/dashboard/LeadSourceChart.jsx";
import Pipeline from "../components/dashboard/Pipeline.jsx";
import RecentActivity from "../components/dashboard/RecentActivity.jsx";
import AttentionLeads from "../components/dashboard/AttentionLeads.jsx";
import AssignmentModal from "../components/leads/AssignmentModal.jsx";
import { useCrm } from "../context/CrmContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { leads, activity, stats } = useCrm();
  const navigate = useNavigate();
  const [assignLead, setAssignLead] = useState(null);

  const cards = [
    { icon: Users, label: "Total Leads", value: stats.total, trend: 8, accent: "ink", to: "/leads" },
    { icon: UserPlus, label: "New Leads", value: stats.new, trend: 12, accent: "ink", to: "/leads" },
    { icon: Heart, label: "Interested", value: stats.interested, trend: 5, accent: "ink" },
    { icon: Flame, label: "Highly Interested", value: stats.highlyInterested, trend: 18, accent: "brass" },
    { icon: BadgeCheck, label: "Qualified", value: stats.qualified, trend: 4, accent: "ink" },
    { icon: Trophy, label: "Converted", value: stats.converted, trend: 22, accent: "brass" },
    { icon: UserRound, label: "Salespeople", value: stats.salespeople, trend: null, accent: "ink", to: "/salespeople" },
    { icon: UserX, label: "Unassigned Leads", value: stats.unassigned, trend: -6, accent: "ink", to: "/leads" },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Good morning, Admin"
        subtitle="Here's what's happening with your sales pipeline today."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} onClick={c.to ? () => navigate(c.to) : undefined} />
        ))}
      </div>

      <div className="mb-6"><Pipeline leads={leads} /></div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadStatusChart leads={leads} />
        <LeadSourceChart leads={leads} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <AttentionLeads leads={leads} onAssign={setAssignLead} />
        </div>
        <div className="xl:col-span-2">
          <RecentActivity activity={activity} />
        </div>
      </div>

      <AssignmentModal open={!!assignLead} onClose={() => setAssignLead(null)} lead={assignLead} />
    </div>
  );
}
