import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, Wallet, Home, Ruler, ClipboardList,
  Calendar, Clock, UserRound, Plus, TrendingUp, MessageSquare, UserPlus, StickyNote,
} from "lucide-react";
import Avatar from "../components/common/Avatar.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import AssignmentModal from "../components/leads/AssignmentModal.jsx";
import { useCrm } from "../context/CrmContext.jsx";
import { STATUSES, STATUS_LABELS } from "../data/mockData.js";
import { formatDateTime, timeAgo } from "../utils/helpers.js";

const ACT_ICONS = {
  created: ClipboardList, message: MessageSquare, status: TrendingUp, assign: UserPlus, note: StickyNote,
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, salespeople, changeLeadStatus, addNoteToLead } = useCrm();
  const [assignOpen, setAssignOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const lead = leads.find((l) => l.id === id);
  if (!lead) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink-500">Lead not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/leads")}>Back to Leads</Button>
      </div>
    );
  }

  const sp = salespeople.find((s) => s.id === lead.assignedTo);

  return (
    <div className="animate-fadeIn">
      <Link to="/leads" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft size={15} /> Back to Leads
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={lead.name} size={56} />
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">{lead.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <span className="text-xs text-ink-400">
                {sp ? <>Assigned to <span className="font-medium text-ink-600">{sp.name}</span></> : "Unassigned"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lead.status}
            onChange={(e) => changeLeadStatus(lead.id, e.target.value)}
            className="rounded-lg border border-ink-100 bg-white px-3.5 py-2.5 text-xs font-semibold text-ink-600 outline-none focus:border-brass-300 focus:ring-2 focus:ring-brass-100"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <Button variant="brass" icon={UserRound} onClick={() => setAssignOpen(true)}>
            {lead.assignedTo ? "Reassign" : "Assign Lead"}
          </Button>
        </div>
      </div>

      {lead.status === "HIGHLY_INTERESTED" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brass-200 bg-brass-50 px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass-500 text-white"><TrendingUp size={15} /></div>
          <p className="text-sm font-medium text-brass-800">This lead is highly interested and needs prompt salesperson attention.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact + Property */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
              <h3 className="mb-4 font-display text-sm font-semibold text-ink-900">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2.5 text-ink-600"><Phone size={14} className="text-ink-300" /> {lead.phone}</p>
                <p className="flex items-center gap-2.5 text-ink-600"><Mail size={14} className="text-ink-300" /> {lead.email || "—"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
              <h3 className="mb-4 font-display text-sm font-semibold text-ink-900">Property Interest</h3>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2.5 text-ink-600"><Home size={14} className="text-ink-300" /> {lead.propertyInterest} · {lead.bhk}</p>
                <p className="flex items-center gap-2.5 text-ink-600"><MapPin size={14} className="text-ink-300" /> {lead.location}</p>
                <p className="flex items-center gap-2.5 text-ink-600"><Wallet size={14} className="text-ink-300" /> {lead.budget}</p>
                <p className="flex items-center gap-2.5 text-ink-600"><Ruler size={14} className="text-ink-300" /> {lead.area}</p>
              </div>
              {lead.requirements && <p className="mt-3 rounded-lg bg-ink-50/60 p-3 text-xs text-ink-500">{lead.requirements}</p>}
            </div>
          </div>

          {/* Lead info */}
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
            <h3 className="mb-4 font-display text-sm font-semibold text-ink-900">Lead Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div><p className="text-[11px] font-semibold uppercase text-ink-300">Source</p><Badge tone="neutral" className="mt-1.5">{lead.source}</Badge></div>
              <div><p className="text-[11px] font-semibold uppercase text-ink-300">Interest</p><div className="mt-1.5"><StatusBadge status={lead.status} size="sm" /></div></div>
              <div><p className="text-[11px] font-semibold uppercase text-ink-300">Created</p><p className="mt-1.5 flex items-center gap-1 text-ink-600"><Calendar size={12} />{formatDateTime(lead.createdAt)}</p></div>
              <div><p className="text-[11px] font-semibold uppercase text-ink-300">Last Interaction</p><p className="mt-1.5 flex items-center gap-1 text-ink-600"><Clock size={12} />{timeAgo(lead.lastInteraction)}</p></div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink-900">Notes</h3>
            </div>
            <div className="mb-4 flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this lead…"
                className="flex-1 rounded-lg border border-ink-100 px-3.5 py-2.5 text-sm outline-none focus:border-brass-300 focus:ring-2 focus:ring-brass-100"
              />
              <Button
                variant="secondary"
                icon={Plus}
                onClick={() => { if (noteText.trim()) { addNoteToLead(lead.id, noteText.trim()); setNoteText(""); } }}
              >
                Add Note
              </Button>
            </div>
            <div className="space-y-3">
              {lead.notes.length === 0 && <p className="text-sm text-ink-300">No notes yet.</p>}
              {lead.notes.map((n) => (
                <div key={n.id} className="rounded-xl bg-ink-50/60 p-3.5">
                  <p className="text-sm text-ink-700">{n.text}</p>
                  <p className="mt-1.5 text-xs text-ink-300">{n.author} · {timeAgo(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h3 className="mb-4 font-display text-sm font-semibold text-ink-900">Activity Timeline</h3>
          <div className="space-y-5">
            {lead.activity.map((a, i) => {
              const Icon = ACT_ICONS[a.type] || ClipboardList;
              return (
                <div key={a.id} className="relative flex gap-3">
                  {i < lead.activity.length - 1 && <span className="absolute left-[13px] top-7 h-full w-px bg-ink-100" />}
                  <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-500">
                    <Icon size={13} />
                  </div>
                  <div className="pb-1">
                    <p className="text-sm text-ink-700">{a.text}</p>
                    <p className="mt-0.5 text-xs text-ink-300">{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AssignmentModal open={assignOpen} onClose={() => setAssignOpen(false)} lead={lead} />
    </div>
  );
}
