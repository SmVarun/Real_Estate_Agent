import React from "react";
import { classNames } from "../../utils/helpers.js";

const VARIANTS = {
  primary:
    "bg-ink-800 text-white hover:bg-ink-900 active:bg-ink-950 shadow-soft",
  brass:
    "bg-brass-500 text-white hover:bg-brass-600 active:bg-brass-700 shadow-soft",
  secondary:
    "bg-white text-ink-700 border border-ink-100 hover:border-ink-200 hover:bg-ink-50",
  ghost: "text-ink-500 hover:bg-ink-50 hover:text-ink-800",
  danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-sm px-5 py-2.5 gap-2",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  children,
  icon: Icon,
  iconRight,
  ...props
}) {
  return (
    <Comp
      className={classNames(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {Icon && !iconRight && <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.2} />}
      {children}
      {Icon && iconRight && <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.2} />}
    </Comp>
  );
}
