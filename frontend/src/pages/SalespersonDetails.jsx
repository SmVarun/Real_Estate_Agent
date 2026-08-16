import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Users, Flame, BadgeCheck, Trophy } from "lucide-react";
import Avatar from "../components/common/Avatar.jsx";
import Badge from "../components/common/Badge.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Button from "../components/common/Button.jsx";
import { useCrm } from "../context/CrmContext.jsx";
import { formatDate, timeAgo } from "../utils/helpers.js";

export default function SalespersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { salespeople, leads, activity } = useCrm();
  const sp = salespeople.find((s) => s.id === id);

  if (!sp) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink-500">Salesperson not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/salespeople")}>Back to Team</Button>
      </div>
    );
  }

  const spLeads = leads.filter((l) => l.assignedTo === sp.id);
  const highly = spLeads.filter((l) => l.status === "HIGHLY_INTERESTED").length;
  const qualified = spLeads.filter((l) => l.status === "QUALIFIED").length;
  const converted = spLeads.filter((l) => l.status === "CONVERTED").length;
  const relatedActivity = activity.filter((a) => a.text.includes(sp.name.split(" ")[0])).slice(0, 8);

  return (
    <div className="animate-fadeIn">
      <Link to="/salespeople" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft size={15} /> Back to Sales Team
      </Link>

      <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={sp.name} color={sp.avatarColor} size={56} />
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">{sp.name}</h1>
            <p className="mt-1 text-sm text-ink-500">{sp.role}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-400">
              <span className="flex items-center gap-1"><Mail size={12} /> {sp.email}</span>
              <span className="flex items-center gap-1"><Phone size={12} /> {sp.phone}</span>
            </div>
          </div>
        </div>
        <Badge tone={sp.status === "Active" ? "success" : "neutral"} dot>{sp.status}</Badge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Users, label: "Assigned Leads", value: spLeads.length },
          { icon: Flame, label: "Highly Interested", value: highly },
          { icon: BadgeCheck, label: "Qualified", value: qualified },
          { icon: Trophy, label: "Converted", value: converted },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600"><c.icon size={16} /></div>
            <p className="mt-4 font-feature-tnum font-display text-2xl font-semibold text-ink-900">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-ink-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink-900">Assigned Leads</h3>
          {spLeads.length === 0 ? (
            <EmptyState title="No leads assigned to this salesperson." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Interaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {spLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-ink-50/40">
                      <td className="px-4 py-3">
                        <Link to={`/leads/${l.id}`} className="flex items-center gap-2.5">
                          <Avatar name={l.name} size={28} />
                          <span className="font-medium text-ink-700 hover:text-brass-600">{l.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-500">{l.propertyInterest}</td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} size="sm" /></td>
                      <td className="px-4 py-3 text-xs text-ink-400">{timeAgo(l.lastInteraction)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-semibold text-ink-900">Recent Activity</h3>
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
            {relatedActivity.length === 0 ? (
              <p className="text-sm text-ink-300">No recent activity for this salesperson.</p>
            ) : (
              <div className="space-y-4">
                {relatedActivity.map((a) => (
                  <div key={a.id}>
                    <p className="text-sm text-ink-700">{a.text}</p>
                    <p className="mt-0.5 text-xs text-ink-300">{a.minutesAgo != null ? `${a.minutesAgo}m ago` : timeAgo(a.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-300">Joined {formatDate(sp.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
