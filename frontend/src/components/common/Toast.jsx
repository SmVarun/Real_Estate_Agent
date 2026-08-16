import React from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useCrm } from "../../context/CrmContext.jsx";

const ICONS = { success: CheckCircle2, info: Info, error: XCircle };
const COLORS = {
  success: "text-emerald-600 bg-emerald-50 border-emerald-100",
  info: "text-ink-600 bg-ink-50 border-ink-100",
  error: "text-red-600 bg-red-50 border-red-100",
};

export default function ToastStack() {
  const { toasts } = useCrm();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant] || CheckCircle2;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-pop animate-slideIn ${COLORS[t.variant] || COLORS.success}`}
          >
            <Icon size={18} className="shrink-0" />
            <p className="text-sm font-medium text-ink-800">{t.message}</p>
          </div>
        );
      })}
    </div>
  );
}
