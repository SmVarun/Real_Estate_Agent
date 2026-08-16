import React, { useState } from "react";
import Drawer from "../common/Drawer.jsx";
import Button from "../common/Button.jsx";
import { STATUSES, STATUS_LABELS, SOURCES } from "../../data/mockData.js";
import { useCrm } from "../../context/CrmContext.jsx";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  propertyInterest: "",
  budget: "",
  location: "",
  bhk: "",
  interestLevel: "INTERESTED",
  source: "Website",
  assignedTo: "",
  status: "NEW",
  notesText: "",
};

export default function LeadForm({ open, onClose, existingLead }) {
  const { addLead, updateLead, salespeople } = useCrm();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (open) {
      setForm(existingLead ? { ...EMPTY, ...existingLead, notesText: "" } : EMPTY);
      setErrors({});
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

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      propertyInterest: form.propertyInterest || "Apartment",
      budget: form.budget || "Not specified",
      location: form.location || "Not specified",
      bhk: form.bhk || "—",
      area: form.area || "—",
      requirements: form.requirements || "",
      source: form.source,
      assignedTo: form.assignedTo || null,
      status: form.status,
    };
    if (existingLead) {
      updateLead(existingLead.id, payload);
    } else {
      addLead(payload);
    }
    onClose();
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
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="brass" onClick={handleSubmit}>{existingLead ? "Save Changes" : "Add Lead"}</Button>
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
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Assigned Salesperson</label>
            <select className={inputClass} value={form.assignedTo || ""} onChange={(e) => set("assignedTo", e.target.value)}>
              <option value="">Unassigned</option>
              {salespeople.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.notesText}
            onChange={(e) => set("notesText", e.target.value)}
            placeholder="Any additional context about this lead…"
          />
        </div>
      </form>
    </Drawer>
  );
}
