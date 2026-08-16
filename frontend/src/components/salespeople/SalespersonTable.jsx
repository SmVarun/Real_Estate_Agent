import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Pencil, Power } from "lucide-react";
import Avatar from "../common/Avatar.jsx";
import Badge from "../common/Badge.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { useCrm } from "../../context/CrmContext.jsx";
import { formatDate } from "../../utils/helpers.js";
import { UserRound } from "lucide-react";

export default function SalespersonTable({ people, onEdit, onAdd }) {
  const { leads, updateSalesperson } = useCrm();
  const [menuFor, setMenuFor] = useState(null);

  if (people.length === 0) {
    return (
      <EmptyState
        icon={UserRound}
        title="No salespeople found"
        description="Add your first team member to start assigning leads."
        actionLabel="Add Salesperson"
        onAction={onAdd}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Highly Interested</th>
              <th className="px-4 py-3">Converted</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {people.map((sp) => {
              const spLeads = leads.filter((l) => l.assignedTo === sp.id);
              const highly = spLeads.filter((l) => l.status === "HIGHLY_INTERESTED").length;
              const converted = spLeads.filter((l) => l.status === "CONVERTED").length;
              return (
                <tr key={sp.id} className="group text-sm hover:bg-ink-50/40">
                  <td className="px-5 py-3.5">
                    <Link to={`/salespeople/${sp.id}`} className="flex items-center gap-3">
                      <Avatar name={sp.name} color={sp.avatarColor} size={34} />
                      <span className="font-semibold text-ink-800 group-hover:text-brass-600">{sp.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-ink-500">
                    <p>{sp.email}</p>
                    <p className="text-xs text-ink-400">{sp.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-ink-600">{sp.role}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone={sp.status === "Active" ? "success" : "neutral"} dot>{sp.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 font-feature-tnum text-ink-700">{spLeads.length}</td>
                  <td className="px-4 py-3.5 font-feature-tnum text-brass-600">{highly}</td>
                  <td className="px-4 py-3.5 font-feature-tnum text-emerald-600">{converted}</td>
                  <td className="px-4 py-3.5 text-xs text-ink-400">{formatDate(sp.createdAt)}</td>
                  <td className="relative px-4 py-3.5 text-right">
                    <button onClick={() => setMenuFor(menuFor === sp.id ? null : sp.id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                      <MoreHorizontal size={16} />
                    </button>
                    {menuFor === sp.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-4 top-10 z-20 w-40 rounded-xl border border-ink-100 bg-white py-1.5 text-left shadow-pop animate-fadeIn">
                          <button onClick={() => { onEdit(sp); setMenuFor(null); }} className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-50">
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => { updateSalesperson(sp.id, { status: sp.status === "Active" ? "Inactive" : "Active" }); setMenuFor(null); }}
                            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-50"
                          >
                            <Power size={14} /> {sp.status === "Active" ? "Deactivate" : "Activate"}
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
    </div>
  );
}
