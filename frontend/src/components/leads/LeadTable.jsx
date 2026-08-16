import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Pencil, UserPlus, Trash2, Mail, Phone } from "lucide-react";
import Avatar from "../common/Avatar.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import Badge from "../common/Badge.jsx";
import EmptyState from "../common/EmptyState.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";
import { useCrm } from "../../context/CrmContext.jsx";
import { timeAgo, formatDate } from "../../utils/helpers.js";
import { Users } from "lucide-react";

export default function LeadTable({ leads, onEdit, onAssign, onAddLead }) {
  const { salespeople, deleteLead } = useCrm();
  const [menuFor, setMenuFor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const spMap = Object.fromEntries(salespeople.map((s) => [s.id, s]));

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No leads found"
        description="Add your first lead to start managing your sales pipeline."
        actionLabel="Add Lead"
        onAction={onAddLead}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3">Lead</th>
              <th className="px-4 py-3">Property Interest</th>
              <th className="px-4 py-3">Interest Level</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Interaction</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {leads.map((lead) => {
              const sp = spMap[lead.assignedTo];
              return (
                <tr key={lead.id} className="group text-sm transition-colors hover:bg-ink-50/40">
                  <td className="px-5 py-3.5">
                    <Link to={`/leads/${lead.id}`} className="flex items-center gap-3">
                      <Avatar name={lead.name} color="#3D5079" size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-800 group-hover:text-brass-600">{lead.name}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-ink-400">
                          <Phone size={10} /> {lead.phone}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-ink-600">
                    <p className="font-medium">{lead.propertyInterest}</p>
                    <p className="text-xs text-ink-400">{lead.location}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={lead.status === "HIGHLY_INTERESTED" ? "brass" : "neutral"}>{lead.bhk}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-ink-500">{lead.source}</td>
                  <td className="px-4 py-3.5">
                    {sp ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={sp.name} color={sp.avatarColor} size={24} />
                        <span className="text-ink-600">{sp.name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAssign(lead)}
                        className="rounded-full border border-dashed border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-400 hover:border-brass-300 hover:text-brass-600"
                      >
                        Unassigned
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={lead.status} size="sm" /></td>
                  <td className="px-4 py-3.5 text-xs text-ink-400">{timeAgo(lead.lastInteraction)}</td>
                  <td className="px-4 py-3.5 text-xs text-ink-400">{formatDate(lead.createdAt)}</td>
                  <td className="relative px-4 py-3.5 text-right">
                    <button
                      onClick={() => setMenuFor(menuFor === lead.id ? null : lead.id)}
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuFor === lead.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-4 top-10 z-20 w-44 rounded-xl border border-ink-100 bg-white py-1.5 text-left shadow-pop animate-fadeIn">
                          <button
                            onClick={() => { onEdit(lead); setMenuFor(null); }}
                            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-50"
                          >
                            <Pencil size={14} /> Edit Lead
                          </button>
                          <button
                            onClick={() => { onAssign(lead); setMenuFor(null); }}
                            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-50"
                          >
                            <UserPlus size={14} /> {lead.assignedTo ? "Reassign" : "Assign"}
                          </button>
                          <button
                            onClick={() => { setConfirmDelete(lead); setMenuFor(null); }}
                            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Delete Lead
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this lead?"
        message={confirmDelete ? `${confirmDelete.name} and all associated activity will be permanently removed.` : ""}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { deleteLead(confirmDelete.id); setConfirmDelete(null); }}
      />
    </div>
  );
}
