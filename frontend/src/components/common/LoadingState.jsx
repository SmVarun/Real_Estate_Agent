import React from "react";

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="skeleton h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-2.5 w-1/4 rounded" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="skeleton h-3 w-1/2 rounded mb-3" />
      <div className="skeleton h-7 w-1/3 rounded mb-2" />
      <div className="skeleton h-2.5 w-1/4 rounded" />
    </div>
  );
}

export default function LoadingState({ rows = 5 }) {
  return (
    <div className="divide-y divide-ink-50">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
