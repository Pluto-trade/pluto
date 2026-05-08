import * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "./Card";

type Tone = "default" | "positive" | "negative" | "info" | "warn";

const toneAccent: Record<Tone, string> = {
  default: "from-white/15 via-white/5 to-transparent",
  positive: "from-[var(--color-green)]/40 via-[var(--color-green)]/10 to-transparent",
  negative: "from-[var(--color-red)]/40 via-[var(--color-red)]/10 to-transparent",
  info: "from-[var(--color-cyan)]/40 via-[var(--color-cyan)]/10 to-transparent",
  warn: "from-[var(--color-amber)]/40 via-[var(--color-amber)]/10 to-transparent",
};

const toneIconBg: Record<Tone, string> = {
  default: "bg-white/[0.06] text-[var(--color-fg-muted)] ring-white/10",
  positive:
    "bg-[color-mix(in_oklab,var(--color-green)_18%,transparent)] text-[var(--color-green)] ring-[color-mix(in_oklab,var(--color-green)_30%,transparent)]",
  negative:
    "bg-[color-mix(in_oklab,var(--color-red)_18%,transparent)] text-[var(--color-red)] ring-[color-mix(in_oklab,var(--color-red)_30%,transparent)]",
  info:
    "bg-[color-mix(in_oklab,var(--color-cyan)_18%,transparent)] text-[var(--color-cyan)] ring-[color-mix(in_oklab,var(--color-cyan)_30%,transparent)]",
  warn:
    "bg-[color-mix(in_oklab,var(--color-amber)_18%,transparent)] text-[var(--color-amber)] ring-[color-mix(in_oklab,var(--color-amber)_30%,transparent)]",
};

const toneValue: Record<Tone, string> = {
  default: "text-white",
  positive: "text-white",
  negative: "text-white",
  info: "text-white",
  warn: "text-white",
};

const toneGlow: Record<Tone, string> = {
  default: "",
  positive: "shadow-[0_0_40px_-12px_rgba(0,255,136,0.3)]",
  negative: "shadow-[0_0_40px_-12px_rgba(255,58,90,0.3)]",
  info: "shadow-[0_0_40px_-12px_rgba(0,212,255,0.3)]",
  warn: "shadow-[0_0_40px_-12px_rgba(255,181,71,0.3)]",
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
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:border-[var(--color-border-strong)] hover:bg-white/[0.045]",
        toneGlow[tone],
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", toneAccent[tone])} />
      <div
        className={cn(
          "absolute -top-12 -right-12 size-40 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none",
          tone === "positive" && "bg-[var(--color-green)]/15",
          tone === "info" && "bg-[var(--color-cyan)]/15",
          tone === "warn" && "bg-[var(--color-amber)]/15",
          tone === "negative" && "bg-[var(--color-red)]/15",
          tone === "default" && "bg-white/5",
        )}
      />

      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
            {label}
          </span>
          {icon ? (
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-xl ring-1 backdrop-blur-sm",
                toneIconBg[tone],
              )}
            >
              {icon}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-4 font-mono text-4xl font-semibold tabular-nums tracking-tight leading-none",
            toneValue[tone],
          )}
        >
          {value}
        </div>
        {hint ? (
          <div className="mt-3 text-xs text-[var(--color-fg-dim)] leading-relaxed">
            {hint}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
