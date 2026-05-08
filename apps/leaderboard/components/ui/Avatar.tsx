import * as React from "react";
import { cn } from "../../lib/utils";

const GRADIENTS: Array<[string, string]> = [
  ["#00D4FF", "#7B4FDB"],
  ["#00FF88", "#00D4FF"],
  ["#FFB547", "#FF3A5A"],
  ["#C64BFF", "#7B4FDB"],
  ["#B8D4E4", "#00D4FF"],
  ["#FF3A5A", "#FFB547"],
  ["#7B4FDB", "#C64BFF"],
  ["#00FF88", "#FFB547"],
];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SIZES = {
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
} as const;

export function Avatar({
  id,
  label,
  size = "md",
  className,
}: {
  id: string;
  label: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const idx = hash(id) % GRADIENTS.length;
  const grad = GRADIENTS[idx]!;
  const initials = label
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-black/80 ring-1 ring-white/10 shadow-sm",
        SIZES[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
      }}
    >
      {initials || "—"}
    </span>
  );
}
