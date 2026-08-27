import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Heart,
  Flame,
  BadgeCheck,
  Trophy,
  UserRound,
  UserX,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import LeadStatusChart from "../components/dashboard/LeadStatusChart.jsx";
import LeadSourceChart from "../components/dashboard/LeadSourceChart.jsx";
import Pipeline from "../components/dashboard/Pipeline.jsx";
import RecentActivity from "../components/dashboard/RecentActivity.jsx";
import AttentionLeads from "../components/dashboard/AttentionLeads.jsx";
import AssignmentModal from "../components/leads/AssignmentModal.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { SkeletonCard } from "../components/common/LoadingState.jsx";
import { useCrm } from "../context/CrmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/*
 * The greeting is derived from the clock rather than hardcoded to
 * "Good morning", which was wrong for most of the day.
 */
function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { leads, activity, stats, loading, errors, refreshStats } = useCrm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignLead, setAssignLead] = useState(null);

  /*
   * No `trend` on any card. The backend keeps no history, so a
   * percentage change against last month is not something this
   * application can currently know — showing one would be inventing
   * it. StatCard already omits the badge when trend is absent.
   */
  const cards = stats
    ? [
        { icon: Users, label: "Total Leads", value: stats.total, accent: "ink", to: "/leads" },
        { icon: UserPlus, label: "New Leads", value: stats.new, accent: "ink", to: "/leads" },
        { icon: Heart, label: "Interested", value: stats.interested, accent: "ink" },
        {
          icon: Flame,
          label: "Highly Interested",
          value: stats.highlyInterested,
          accent: "brass",
        },
        { icon: BadgeCheck, label: "Qualified", value: stats.qualified, accent: "ink" },
        { icon: Trophy, label: "Converted", value: stats.converted, accent: "brass" },
        {
          icon: UserRound,
          label: "Active Team",
          value: stats.salespeople,
          accent: "ink",
          to: "/salespeople",
        },
        {
          icon: UserX,
          label: "Unassigned Leads",
          value: stats.unassigned,
          accent: "ink",
          to: "/leads",
        },
      ]
    : [];

  const chartsReady = !loading.leads && !errors.leads;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(" ")[0] || "there"}`}
        subtitle="Here's what's happening with your sales pipeline today."
      />

      {/* Statistics */}
      {loading.stats ? (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : errors.stats ? (
        <div className="mb-6">
          <EmptyState
            icon={AlertCircle}
            title="Could not load statistics"
            description={errors.stats}
            actionLabel="Try again"
            onAction={() => refreshStats()}
          />
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              {...card}
              onClick={card.to ? () => navigate(card.to) : undefined}
            />
          ))}
        </div>
      )}

      {/*
        The charts are computed from the leads list, so they wait on
        the same request rather than rendering an axis full of zeroes
        while it is in flight.
      */}
      {chartsReady && (
        <>
          <div className="mb-6">
            <Pipeline leads={leads} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LeadStatusChart leads={leads} />
            <LeadSourceChart leads={leads} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          {chartsReady ? (
            <AttentionLeads leads={leads} onAssign={setAssignLead} />
          ) : null}
        </div>
        <div className="xl:col-span-2">
          <RecentActivity
            activity={activity}
            loading={loading.activity}
            error={errors.activity}
          />
        </div>
      </div>

      <AssignmentModal
        open={!!assignLead}
        onClose={() => setAssignLead(null)}
        lead={assignLead}
      />
    </div>
  );
}
