import React, { useState } from "react";
import { Plus, Building2, Mail, Phone, Globe, MapPin, Clock, Save } from "lucide-react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import PropertyCard from "../components/company/PropertyCard.jsx";
import PropertyForm from "../components/company/PropertyForm.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { useCrm } from "../context/CrmContext.jsx";

export default function Company() {
  const { company, setCompany, properties, deleteProperty, pushToast } = useCrm();
  const [form, setForm] = useState(company);
  const [dirty, setDirty] = useState(false);
  const [propFormOpen, setPropFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function handleSave(e) {
    e.preventDefault();
    setCompany(form);
    setDirty(false);
    pushToast("Company information updated");
  }

  const inputClass =
    "w-full rounded-lg border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100";
  const labelClass = "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400";

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Company & Products" subtitle="Manage your company profile and property listings." />

      {/* Company info */}
      <form onSubmit={handleSave} className="mb-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600"><Building2 size={16} /></div>
          <div>
            <h3 className="font-display text-sm font-semibold text-ink-900">Company Information</h3>
            <p className="text-xs text-ink-400">Visible to leads through the AI sales agent</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Phone size={12} /> Phone</label>
            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Mail size={12} /> Email</label>
            <input className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Globe size={12} /> Website</label>
            <input className={inputClass} value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}><Clock size={12} /> Business Hours</label>
            <input className={inputClass} value={form.hours} onChange={(e) => set("hours", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}><MapPin size={12} /> Address</label>
            <input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit" variant="brass" icon={Save} disabled={!dirty}>Save Changes</Button>
        </div>
      </form>

      {/* Properties */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink-900">Property Listings</h3>
          <p className="text-xs text-ink-400">{properties.length} properties in your catalog</p>
        </div>
        <Button variant="brass" size="sm" icon={Plus} onClick={() => { setEditingProperty(null); setPropFormOpen(true); }}>
          Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState title="No properties added" description="Add your first listing so the AI agent can recommend it to leads." actionLabel="Add Property" onAction={() => setPropFormOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onEdit={(prop) => { setEditingProperty(prop); setPropFormOpen(true); }}
              onDelete={(prop) => setConfirmDelete(prop)}
            />
          ))}
        </div>
      )}

      <PropertyForm open={propFormOpen} onClose={() => setPropFormOpen(false)} existing={editingProperty} />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove this property?"
        message={confirmDelete ? `${confirmDelete.name} will be removed from your catalog.` : ""}
        confirmLabel="Remove"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { deleteProperty(confirmDelete.id); setConfirmDelete(null); }}
      />
    </div>
  );
}
