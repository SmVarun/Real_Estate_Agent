import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";

import Drawer from "../common/Drawer.jsx";
import Button from "../common/Button.jsx";
import Avatar from "../common/Avatar.jsx";
import { updateUserRole } from "../../api/users.js";
import { ApiError } from "../../api/client.js";
import { useCrm } from "../../context/CrmContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLE_VALUES, ROLE_LABELS, isAdmin } from "../../constants/index.js";

/*
 * Role management for one team member.
 *
 * This is deliberately NOT a "create/edit user" form. The backend has
 * no endpoint to create a user on someone else's behalf or to edit
 * their name, email or phone — accounts are created by signing up, and
 * PATCH /users/:id/role is the only user mutation that exists.
 *
 * Rather than keep a form whose Save button could not save anything,
 * this exposes the operation that is actually supported and says so.
 */
export default function SalespersonForm({ open, onClose, existing }) {
  const { pushToast, refreshSalespeople } = useCrm();
  const { user } = useAuth();

  const [role, setRole] = useState(existing?.role || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setRole(existing?.role || "");
      setError(null);
      setSaving(false);
    }
  }, [open, existing]);

  if (!existing) return null;

  /*
   * The backend refuses both of these, so they are refused here too
   * rather than offered and then rejected.
   */
  const isSelf = user?.id === existing.id;
  const canEdit = isAdmin(user) && !isSelf;

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || !canEdit || role === existing.role) return;

    setSaving(true);
    setError(null);

    try {
      await updateUserRole(existing.id, role);

      /*
       * Refetched rather than patched locally: the roster drives
       * assignment elsewhere and should reflect the server.
       */
      await refreshSalespeople();

      pushToast(`${existing.name} is now ${ROLE_LABELS[role]}`);
      onClose();
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "Could not update the role.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

  const inputClass =
    "w-full rounded-lg border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100 disabled:bg-ink-50 disabled:text-ink-400";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Team Member"
      subtitle="View details and manage access level"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button
            variant="brass"
            onClick={handleSubmit}
            disabled={saving || !canEdit || role === existing.role}
          >
            {saving ? "Saving…" : "Update Role"}
          </Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3.5">
          <Avatar name={existing.name} size={48} />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-ink-900">
              {existing.name}
            </p>
            <p className="truncate text-sm text-ink-400">@{existing.username}</p>
          </div>
        </div>

        {/*
          Read-only because the API has no route to change them. They
          are shown rather than hidden so this drawer is still useful
          as a profile view.
        */}
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} value={existing.email} disabled readOnly />
        </div>

        <div>
          <label className={labelClass}>Access Level</label>
          <select
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={!canEdit}
          >
            {ROLE_VALUES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>

          {!canEdit && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-400">
              <Info size={11} className="mt-0.5 shrink-0" />
              {isSelf
                ? "You cannot change your own role."
                : "Only administrators can change a team member's role."}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}

        {/*
          Stated plainly so nobody looks for an edit button that the
          backend cannot honour.
        */}
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-3.5 py-3">
          <p className="text-[11px] leading-relaxed text-ink-400">
            Name, email and phone are set by the team member when they
            register. There is no API to edit another person's details or to
            create an account on their behalf, so those fields are read-only
            here.
          </p>
        </div>
      </form>
    </Drawer>
  );
}
