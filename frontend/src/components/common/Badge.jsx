import React from "react";
import { classNames } from "../../utils/helpers.js";

export default function Badge({ children, tone = "neutral", className, dot = false }) {
  const TONES = {
    neutral: "bg-ink-50 text-ink-600 border-ink-100",
    brass: "bg-brass-50 text-brass-700 border-brass-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    danger: "bg-red-50 text-red-600 border-red-100",
    info: "bg-blue-50 text-blue-600 border-blue-100",
  };
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        TONES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
