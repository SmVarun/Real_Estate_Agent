import React, { useState, useEffect } from "react";
import Modal from "../common/Modal.jsx";
import Button from "../common/Button.jsx";
import { useCrm } from "../../context/CrmContext.jsx";

const EMPTY = {
  name: "", type: "Apartment", location: "", price: "", bhk: "", area: "",
  amenities: "", availability: "Ready to Move",
  image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
};

export default function PropertyForm({ open, onClose, existing }) {
  const { addProperty, updateProperty } = useCrm();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      setForm(existing ? { ...EMPTY, ...existing, amenities: existing.amenities.join(", ") } : EMPTY);
    }
  }, [open, existing]);

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!form.name.trim() || !form.location.trim()) return;
    const payload = { ...form, amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean) };
    if (existing) updateProperty(existing.id, payload);
    else addProperty(payload);
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit Property" : "Add Property"}
      subtitle="This listing is stored locally for the prototype"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="brass" onClick={handleSubmit}>{existing ? "Save Changes" : "Add Property"}</Button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div className="col-span-2">
          <label className={labelClass}>Property Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Skyline Residency" />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {["Apartment", "Villa", "Plot", "Commercial"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Location *</label>
          <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Whitefield, Bengaluru" />
        </div>
        <div>
          <label className={labelClass}>Price</label>
          <input className={inputClass} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. ₹1.25 Cr" />
        </div>
        <div>
          <label className={labelClass}>BHK / Configuration</label>
          <input className={inputClass} value={form.bhk} onChange={(e) => set("bhk", e.target.value)} placeholder="e.g. 3 BHK" />
        </div>
        <div>
          <label className={labelClass}>Area</label>
          <input className={inputClass} value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. 1,850 sq.ft." />
        </div>
        <div>
          <label className={labelClass}>Availability</label>
          <select className={inputClass} value={form.availability} onChange={(e) => set("availability", e.target.value)}>
            <option>Ready to Move</option>
            <option>Under Construction</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Amenities (comma separated)</label>
          <input className={inputClass} value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Swimming Pool, Gym, Parking" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Image URL</label>
          <input className={inputClass} value={form.image} onChange={(e) => set("image", e.target.value)} />
        </div>
      </form>
    </Modal>
  );
}
