import React, { useState, useEffect } from "react";
import Drawer from "../common/Drawer.jsx";
import Button from "../common/Button.jsx";
import { ROLES } from "../../data/mockData.js";
import { useCrm } from "../../context/CrmContext.jsx";

const EMPTY = { name: "", email: "", phone: "", role: "Sales Executive", status: "Active", territory: "" };

export default function SalespersonForm({ open, onClose, existing }) {
  const { addSalesperson, updateSalesperson } = useCrm();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(existing ? { ...EMPTY, ...existing } : EMPTY);
      setErrors({});
    }
  }, [open, existing]);

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    if (existing) updateSalesperson(existing.id, form);
    else addSalesperson(form);
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={existing ? "Edit Salesperson" : "Add Salesperson"}
      subtitle={existing ? "Update team member details" : "Add a new member to your sales team"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="brass" onClick={handleSubmit}>{existing ? "Save Changes" : "Add Salesperson"}</Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass}>Full Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Priya Nair" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@keystonecrm.in" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Role</label>
            <select className={inputClass} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Territory / Notes</label>
          <input className={inputClass} value={form.territory} onChange={(e) => set("territory", e.target.value)} placeholder="e.g. Bengaluru East" />
        </div>
      </form>
    </Drawer>
  );
}
