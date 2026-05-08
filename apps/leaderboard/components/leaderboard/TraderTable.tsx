import Link from "next/link";
import { ChevronRight, Crown, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { Table, TBody, TD, TH, THead, TR } from "../ui/Table";
import { formatNumber, formatUsd } from "../../lib/format";
import type { LeaderboardRow } from "../../lib/leaderboard";

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="inline-flex size-8 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-amber)_25%,transparent)] text-[var(--color-amber)] ring-1 ring-[color-mix(in_oklab,var(--color-amber)_45%,transparent)] shadow-[0_0_18px_-2px_rgba(255,181,71,0.45)]">
        <Crown size={14} strokeWidth={2.4} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="inline-flex size-8 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-ice)_25%,transparent)] text-[var(--color-ice)] ring-1 ring-[color-mix(in_oklab,var(--color-ice)_45%,transparent)]">
        <Medal size={14} strokeWidth={2.4} />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="inline-flex size-8 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-rust)_30%,transparent)] text-[var(--color-tan)] ring-1 ring-[color-mix(in_oklab,var(--color-rust)_55%,transparent)]">
        <Award size={14} strokeWidth={2.4} />
      </div>
    );
  }
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/[0.04] text-xs font-mono font-semibold tabular-nums text-[var(--color-fg-muted)] ring-1 ring-white/5">
      {rank}
    </span>
  );
}

export function TraderTable({
  rows,
  windowKey,
}: {
  rows: LeaderboardRow[];
  windowKey: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Leaderboard</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Ranked by estimated USD saved · ties broken by # protections
          </p>
        </div>
        <Badge variant="info">{rows.length} traders</Badge>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <THead>
            <TR>
              <TH className="w-14 pl-5 text-center">#</TH>
              <TH>Trader</TH>
              <TH className="text-right">Saved</TH>
              <TH className="text-right">Protections</TH>
              <TH className="text-right">Stale</TH>
              <TH className="text-right">Markets</TH>
              <TH>Top market</TH>
              <TH className="w-10 pr-5"></TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <TR>
                <TD
                  colSpan={8}
                  className="py-16 text-center text-sm text-[var(--color-fg-dim)]"
                >
                  <div className="mx-auto max-w-sm space-y-2">
                    <div className="text-base text-[var(--color-fg-muted)]">
                      No traders yet
                    </div>
                    <p>
                      Once MPE cancels orders, the protected traders will rank
                      themselves here automatically.
                    </p>
                  </div>
                </TD>
              </TR>
            ) : (
              rows.map((r) => (
                <TR
                  key={r.userId}
                  className="cursor-pointer hover:bg-white/[0.035]"
                >
                  <TD className="pl-5 text-center align-middle">
                    <Link
                      href={{
                        pathname: `/traders/${r.userId}`,
                        query: { window: windowKey },
                      }}
                      className="inline-flex"
                    >
                      <RankCell rank={r.rank} />
                    </Link>
                  </TD>
                  <TD className="align-middle">
                    <Link
                      href={{
                        pathname: `/traders/${r.userId}`,
                        query: { window: windowKey },
                      }}
                      className="group flex items-center gap-3"
                    >
                      <Avatar id={r.userId} label={r.displayName} size="md" />
                      <div className="flex flex-col leading-tight">
                        <span className="font-semibold text-white transition-colors group-hover:text-[var(--color-cyan)]">
                          {r.displayName}
                        </span>
                        {r.walletShort && r.walletShort !== r.displayName ? (
                          <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
                            {r.walletShort}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </TD>
                  <TD className="text-right align-middle">
                    <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--color-green)]">
                      {formatUsd(r.savedUsd, { compact: true })}
                    </span>
                  </TD>
                  <TD className="text-right align-middle font-mono tabular-nums text-white">
                    {formatNumber(r.protections)}
                  </TD>
                  <TD className="text-right align-middle">
                    {r.staleCancels > 0 ? (
                      <Badge variant="info">{r.staleCancels}</Badge>
                    ) : (
                      <span className="text-[var(--color-fg-dim)]">—</span>
                    )}
                  </TD>
                  <TD className="text-right align-middle font-mono tabular-nums text-[var(--color-fg-muted)]">
                    {r.marketsCount}
                  </TD>
                  <TD className="align-middle font-mono text-xs text-[var(--color-fg-muted)]">
                    {r.topMarket ?? "—"}
                  </TD>
                  <TD className="pr-5 align-middle text-[var(--color-fg-dim)] transition-colors group-hover:text-white">
                    <ChevronRight size={16} />
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
