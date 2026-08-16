import React, { useState } from "react";
import Modal from "../common/Modal.jsx";
import Button from "../common/Button.jsx";
import Avatar from "../common/Avatar.jsx";
import { useCrm } from "../../context/CrmContext.jsx";

export default function AssignmentModal({ open, onClose, lead }) {
  const { salespeople, assignLead } = useCrm();
  const [selected, setSelected] = useState(lead?.assignedTo || "");

  React.useEffect(() => {
    if (open) setSelected(lead?.assignedTo || "");
  }, [open, lead]);

  if (!lead) return null;

  function handleAssign() {
    assignLead(lead.id, selected || null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead.assignedTo ? "Reassign Lead" : "Assign Lead"}
      subtitle={`${lead.name} · ${lead.propertyInterest}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="brass" onClick={handleAssign}>{lead.assignedTo ? "Reassign" : "Assign Lead"}</Button>
        </>
      }
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Select Salesperson</p>
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {salespeople.filter((s) => s.status === "Active").map((sp) => (
          <button
            type="button"
            key={sp.id}
            onClick={() => setSelected(sp.id)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
              selected === sp.id ? "border-brass-300 bg-brass-50" : "border-ink-100 hover:bg-ink-50"
            }`}
          >
            <Avatar name={sp.name} color={sp.avatarColor} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-800">{sp.name}</p>
              <p className="truncate text-xs text-ink-400">{sp.role}</p>
            </div>
            {selected === sp.id && <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-brass-500" />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
