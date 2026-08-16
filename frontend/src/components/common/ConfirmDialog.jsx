import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button.jsx";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-pop animate-fadeIn">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-brass-50 text-brass-600"}`}>
          <AlertTriangle size={18} />
        </div>
        <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{title}</h3>
        <p className="mt-1.5 text-sm text-ink-500">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
