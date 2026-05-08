import Link from "next/link";
import { cn } from "../../lib/utils";

const OPTIONS = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
] as const;

export function WindowSwitch({
  basePath,
  current,
}: {
  basePath: string;
  current: string;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-white/[0.03] p-1 backdrop-blur-md">
      {OPTIONS.map((opt) => {
        const active = opt.key === current;
        return (
          <Link
            key={opt.key}
            href={{ pathname: basePath, query: { window: opt.key } }}
            className={cn(
              "px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-lg transition-all",
              active
                ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-[var(--color-fg-muted)] hover:text-white",
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
