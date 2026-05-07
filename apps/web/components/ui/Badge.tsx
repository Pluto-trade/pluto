import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "neutral" | "allow" | "cancel" | "warn" | "info";

const styles: Record<Variant, string> = {
  neutral:
    "bg-white/5 text-[var(--color-fg-muted)] border-[var(--color-border)]",
  allow:
    "bg-[color-mix(in_oklab,var(--color-green)_18%,transparent)] text-[var(--color-green)] border-[color-mix(in_oklab,var(--color-green)_30%,transparent)]",
  cancel:
    "bg-[color-mix(in_oklab,var(--color-red)_18%,transparent)] text-[var(--color-red)] border-[color-mix(in_oklab,var(--color-red)_30%,transparent)]",
  warn:
    "bg-[color-mix(in_oklab,var(--color-amber)_18%,transparent)] text-[var(--color-amber)] border-[color-mix(in_oklab,var(--color-amber)_30%,transparent)]",
  info:
    "bg-[color-mix(in_oklab,var(--color-cyan)_18%,transparent)] text-[var(--color-cyan)] border-[color-mix(in_oklab,var(--color-cyan)_30%,transparent)]",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
