import * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "./Card";

type Tone = "default" | "positive" | "negative" | "info" | "warn";

const accent: Record<Tone, string> = {
  default: "from-white/10 to-transparent",
  positive: "from-[var(--color-green)]/35 to-transparent",
  negative: "from-[var(--color-red)]/35 to-transparent",
  info: "from-[var(--color-cyan)]/35 to-transparent",
  warn: "from-[var(--color-amber)]/35 to-transparent",
};

const valueColor: Record<Tone, string> = {
  default: "text-white",
  positive: "text-[var(--color-green)]",
  negative: "text-[var(--color-red)]",
  info: "text-[var(--color-cyan)]",
  warn: "text-[var(--color-amber)]",
};

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          accent[tone],
        )}
      />
      <div className="px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-fg-muted)]">
            {label}
          </span>
          {icon ? (
            <span className="text-[var(--color-fg-dim)]">{icon}</span>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-3 font-mono text-3xl font-semibold tabular-nums",
            valueColor[tone],
          )}
        >
          {value}
        </div>
        {hint ? (
          <div className="mt-2 text-xs text-[var(--color-fg-dim)]">{hint}</div>
        ) : null}
      </div>
    </Card>
  );
}
