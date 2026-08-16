import React from "react";
import { MapPin, Maximize2, Pencil, Trash2 } from "lucide-react";
import Badge from "../common/Badge.jsx";

export default function PropertyCard({ property, onEdit, onDelete }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all hover:shadow-card">
      <div className="relative h-40 w-full overflow-hidden bg-ink-100">
        <img
          src={property.image}
          alt={property.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge tone={property.availability === "Ready to Move" ? "success" : "info"}>{property.availability}</Badge>
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onEdit(property)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-ink-600 hover:bg-white">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(property)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-500 hover:bg-white">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display text-[15px] font-semibold text-ink-900">{property.name}</h4>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
          <MapPin size={12} /> {property.location}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-brass-600">{property.price}</p>
          <p className="flex items-center gap-1 text-xs font-medium text-ink-500">
            <Maximize2 size={11} /> {property.area}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="neutral">{property.bhk}</Badge>
          {property.amenities.slice(0, 2).map((a) => <Badge key={a} tone="neutral">{a}</Badge>)}
          {property.amenities.length > 2 && <Badge tone="neutral">+{property.amenities.length - 2}</Badge>}
        </div>
      </div>
    </div>
  );
}
