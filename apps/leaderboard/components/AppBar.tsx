import Link from "next/link";
import { Trophy } from "lucide-react";

export function AppBar() {
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[rgba(0,0,8,0.7)] px-6 py-4 backdrop-blur-md">
      <div className="flex items-baseline gap-3">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight grad-cyan"
        >
          Plut0x
        </Link>
        <span className="hidden text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-fg-dim)] sm:inline">
          MPE Leaderboard
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] transition hover:bg-white/10 hover:text-white"
        >
          <Trophy size={14} />
          Top traders
        </Link>
      </div>
    </nav>
  );
}
