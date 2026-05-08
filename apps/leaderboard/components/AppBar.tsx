import Link from "next/link";

export function AppBar() {
  return (
    <nav className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[rgba(0,0,8,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight grad-cyan transition-opacity hover:opacity-90"
          >
            Plut0x
          </Link>
          <span className="hidden h-4 w-px bg-[var(--color-border-strong)] sm:inline" />
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-fg-dim)] sm:inline">
            MPE Leaderboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 transition-colors hover:text-white sm:inline-flex"
          >
            Leaderboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-[var(--color-border)] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-fg-muted)] transition-all hover:border-[var(--color-border-strong)] hover:bg-white/[0.06] hover:text-white"
          >
            Docs
          </a>
        </div>
      </div>
    </nav>
  );
}
