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
    <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white/[0.03] p-0.5">
      {OPTIONS.map((opt) => {
        const active = opt.key === current;
        return (
          <Link
            key={opt.key}
            href={{ pathname: basePath, query: { window: opt.key } }}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition",
              active
                ? "bg-white/10 text-white"
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
