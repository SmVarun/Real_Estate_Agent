import React from "react";
import { initials, classNames } from "../../utils/helpers.js";

export default function Avatar({ name, color = "#3D5079", size = 36, className }) {
  return (
    <div
      className={classNames("flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
