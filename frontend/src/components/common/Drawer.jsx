import React from "react";
import { X } from "lucide-react";

export default function Drawer({ open, onClose, title, subtitle, children, footer, width = "480px" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] animate-fadeIn" onClick={onClose} />
      <div
        className="relative h-full bg-white shadow-pop flex flex-col animate-slideIn"
        style={{ width: "min(100%, " + width + ")" }}
      >
        <div className="flex items-start justify-between border-b border-ink-100 px-6 py-4 shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-6 py-4 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
