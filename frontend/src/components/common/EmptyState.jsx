import React from "react";
import Button from "./Button.jsx";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink-400">
          <Icon size={22} />
        </div>
      )}
      <h4 className="font-display text-base font-semibold text-ink-800">{title}</h4>
      {description && <p className="mt-1.5 max-w-xs text-sm text-ink-400">{description}</p>}
      {actionLabel && (
        <Button variant="primary" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
