import React, { useState } from "react";
import Drawer from "../common/Drawer.jsx";
import Button from "../common/Button.jsx";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_SOURCES,
} from "../../constants/index.js";
import { useCrm } from "../../context/CrmContext.jsx";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  propertyInterest: "",
  budget: "",
  location: "",
  bhk: "",
  area: "",
  requirements: "",
  source: "Website",
  assignedTo: "",
  status: "NEW",
};

export default function LeadForm({ open, onClose, existingLead }) {
  const { addLead, updateLead, salespeople, canAssign } = useCrm();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* Only an active user can be assigned - the backend rejects the rest. */
  const assignableUsers = salespeople.filter((person) => person.isActive);

  React.useEffect(() => {
    if (open) {
      setForm(
        existingLead
          ? { ...EMPTY, ...existingLead, assignedTo: existingLead.assignedTo || "" }
          : EMPTY
      );
      setErrors({});
      setSubmitting(false);
    }
  }, [open, existingLead]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();

    if (submitting) return;
    if (!validate()) return;

    /*
     * Optional fields go as "" rather than a placeholder like
     * "Not specified" - an empty field means the information was not
     * captured, and filler would make it look as though it was.
     */
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      propertyInterest: form.propertyInterest.trim(),
      budget: form.budget.trim(),
      location: form.location.trim(),
      bhk: form.bhk.trim(),
      area: form.area.trim(),
      requirements: form.requirements.trim(),
      source: form.source,
      status: form.status,
    };

    /*
     * Assignment is admin/manager-only on the backend, so a rep form
     * must not send the field at all.
     */
    if (canAssign) {
      payload.assignedTo = form.assignedTo || null;
    }

    setSubmitting(true);

    try {
      if (existingLead) {
        await updateLead(existingLead.id, payload);
      } else {
        await addLead(payload);
      }

      onClose();
    } catch (error) {
      /*
       * Field-level messages from the backend validator land on the
       * inputs they belong to; the context has already shown the
       * summary as a toast.
       */
      if (error?.fieldErrors) {
        setErrors(error.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={existingLead ? "Edit Lead" : "Add Lead"}
      subtitle={existingLead ? "Update opportunity details" : "Create a new sales opportunity"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="brass" onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? "Saving…"
              : existingLead
              ? "Save Changes"
              : "Add Lead"}
          </Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass}>Full Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Rahul Sharma" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Property Interest</label>
            <input className={inputClass} value={form.propertyInterest} onChange={(e) => set("propertyInterest", e.target.value)} placeholder="e.g. 3 BHK Apartment" />
          </div>
          <div>
            <label className={labelClass}>Budget</label>
            <input className={inputClass} value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. ₹85 Lakh" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Location</label>
            <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Whitefield, Bengaluru" />
          </div>
          <div>
            <label className={labelClass}>Lead Source</label>
            <select className={inputClass} value={form.source} onChange={(e) => set("source", e.target.value)}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Assigned Salesperson</label>
            <select
              className={inputClass}
              value={form.assignedTo || ""}
              onChange={(e) => set("assignedTo", e.target.value)}
              disabled={!canAssign}
              title={canAssign ? undefined : "Only administrators and managers can assign leads"}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Configuration</label>
            <input className={inputClass} value={form.bhk} onChange={(e) => set("bhk", e.target.value)} placeholder="e.g. 3 BHK" />
          </div>
          <div>
            <label className={labelClass}>Area</label>
            <input className={inputClass} value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. 1450 sq.ft." />
          </div>
        </div>

        {/*
          Notes are added from the lead page - the API attaches them to
          an existing lead, so there is nothing to attach one to until
          this form has been saved.
        */}
        <div>
          <label className={labelClass}>Requirements</label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.requirements}
            onChange={(e) => set("requirements", e.target.value)}
            placeholder="Any additional context about this lead…"
          />
        </div>
      </form>
    </Drawer>
  );
}
