import React, { useState } from "react";
import Modal from "../common/Modal.jsx";
import Button from "../common/Button.jsx";
import Avatar from "../common/Avatar.jsx";
import { useCrm } from "../../context/CrmContext.jsx";
import { roleLabel } from "../../constants/index.js";

export default function AssignmentModal({ open, onClose, lead }) {
  const { salespeople, assignLead, loading } = useCrm();
  const [selected, setSelected] = useState(lead?.assignedTo || "");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      setSelected(lead?.assignedTo || "");
      setSubmitting(false);
    }
  }, [open, lead]);

  if (!lead) return null;

  /*
   * The backend refuses an assignment to an inactive account, so
   * those are not offered.
   */
  const assignable = salespeople.filter((person) => person.isActive);

  async function handleAssign() {
    if (submitting) return;

    setSubmitting(true);

    try {
      await assignLead(lead.id, selected || null);
      onClose();
    } catch {
      /* Already surfaced as a toast by the context. */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead.assignedTo ? "Reassign Lead" : "Assign Lead"}
      subtitle={`${lead.name}${lead.propertyInterest ? ` · ${lead.propertyInterest}` : ""}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="brass" onClick={handleAssign} disabled={submitting}>
            {submitting
              ? "Saving…"
              : lead.assignedTo
              ? "Reassign"
              : "Assign Lead"}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
        Select Salesperson
      </p>

      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {/*
          Clearing an assignment is a real action the API supports, so
          it gets an option rather than being reachable only by
          deselecting.
        */}
        <button
          type="button"
          onClick={() => setSelected("")}
          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            selected === "" ? "border-brass-300 bg-brass-50" : "border-ink-100 hover:bg-ink-50"
          }`}
        >
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-dashed border-ink-200 text-xs text-ink-300">
            —
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-800">Unassigned</p>
            <p className="truncate text-xs text-ink-400">Leave this lead in the pool</p>
          </div>
          {selected === "" && <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-brass-500" />}
        </button>

        {loading.salespeople ? (
          <p className="px-1 py-4 text-sm text-ink-400">Loading the team…</p>
        ) : assignable.length === 0 ? (
          <p className="px-1 py-4 text-sm text-ink-400">
            No active team members to assign this lead to.
          </p>
        ) : (
          assignable.map((person) => (
            <button
              type="button"
              key={person.id}
              onClick={() => setSelected(person.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                selected === person.id
                  ? "border-brass-300 bg-brass-50"
                  : "border-ink-100 hover:bg-ink-50"
              }`}
            >
              <Avatar name={person.name} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-800">{person.name}</p>
                <p className="truncate text-xs text-ink-400">{roleLabel(person.role)}</p>
              </div>
              {selected === person.id && (
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-brass-500" />
              )}
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
