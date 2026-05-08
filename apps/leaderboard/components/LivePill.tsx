export function LivePill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-fg-muted)] backdrop-blur-md">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-green)]/70 animate-ping-soft" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-green)] shadow-[0_0_8px_rgba(0,255,136,0.8)]" />
      </span>
      {children}
    </div>
  );
}
