import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Home, Wallet, UserRound, StickyNote, ArrowUpRight } from "lucide-react";
import Avatar from "../common/Avatar.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import Button from "../common/Button.jsx";
import { useCrm } from "../../context/CrmContext.jsx";
import AssignmentModal from "../leads/AssignmentModal.jsx";

export default function LeadInfoPanel({ lead }) {
  const { salespeople, changeLeadStatus, addNoteToLead } = useCrm();
  const [assignOpen, setAssignOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const sp = salespeople.find((s) => s.id === lead?.assignedTo);

  if (!lead) return <div className="hidden h-full border-l border-ink-100 bg-white lg:block" />;

  const Row = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-400">
        <Icon size={13} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">{label}</p>
        <p className="truncate text-sm text-ink-700">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="hidden h-full flex-col overflow-y-auto border-l border-ink-100 bg-white lg:flex">
      <div className="border-b border-ink-100 p-5 text-center">
        <Avatar name={lead.name} size={56} className="mx-auto" />
        <p className="mt-3 font-display text-base font-semibold text-ink-900">{lead.name}</p>
        <div className="mt-2 flex justify-center"><StatusBadge status={lead.status} /></div>
        <Link to={`/leads/${lead.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brass-600 hover:text-brass-700">
          View Full Profile <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-ink-50 px-5">
        <Row icon={Phone} label="Phone" value={lead.phone} />
        <Row icon={Mail} label="Email" value={lead.email || "—"} />
        <Row icon={Home} label="Property" value={lead.propertyInterest} />
        <Row icon={Wallet} label="Budget" value={lead.budget} />
        <Row icon={UserRound} label="Salesperson" value={sp ? sp.name : "Unassigned"} />
      </div>

      <div className="space-y-2 border-t border-ink-100 p-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-300">Quick Actions</p>
        <select
          value={lead.status}
          onChange={(e) => changeLeadStatus(lead.id, e.target.value)}
          className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-xs font-medium text-ink-600 outline-none focus:border-brass-300 focus:ring-2 focus:ring-brass-100"
        >
          {["NEW", "CONTACTED", "INTERESTED", "HIGHLY_INTERESTED", "QUALIFIED", "CONVERTED", "NOT_INTERESTED", "LOST"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <Button variant="secondary" size="sm" className="w-full" icon={UserRound} onClick={() => setAssignOpen(true)}>
          {lead.assignedTo ? "Reassign" : "Assign Lead"}
        </Button>
        <div className="flex gap-1.5">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 rounded-lg border border-ink-100 px-3 py-2 text-xs outline-none focus:border-brass-300 focus:ring-2 focus:ring-brass-100"
          />
          <Button
            variant="secondary"
            size="sm"
            icon={StickyNote}
            onClick={() => { if (noteText.trim()) { addNoteToLead(lead.id, noteText.trim()); setNoteText(""); } }}
          />
        </div>
      </div>

      <AssignmentModal open={assignOpen} onClose={() => setAssignOpen(false)} lead={lead} />
    </div>
  );
}
