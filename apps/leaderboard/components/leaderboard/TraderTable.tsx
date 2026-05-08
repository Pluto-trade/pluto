import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "../ui/Table";
import { formatNumber, formatUsd } from "../../lib/format";
import type { LeaderboardRow } from "../../lib/leaderboard";

function rankColor(rank: number) {
  if (rank === 1) return "text-[var(--color-amber)]";
  if (rank === 2) return "text-[var(--color-ice)]";
  if (rank === 3) return "text-[var(--color-rust)]";
  return "text-[var(--color-fg-muted)]";
}

export function TraderTable({
  rows,
  windowKey,
}: {
  rows: LeaderboardRow[];
  windowKey: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Leaderboard</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Ranked by estimated USD saved (then by # protections)
          </p>
        </div>
        <Badge variant="info">{rows.length} traders</Badge>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <THead>
            <TR>
              <TH className="w-12 text-center">#</TH>
              <TH>Trader</TH>
              <TH className="text-right">Saved $</TH>
              <TH className="text-right">Protections</TH>
              <TH className="text-right">Stale</TH>
              <TH className="text-right">Markets</TH>
              <TH>Top market</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <TR>
                <TD
                  colSpan={7}
                  className="py-12 text-center text-sm text-[var(--color-fg-dim)]"
                >
                  No protected traders in this window yet.
                  <br />
                  Once MPE cancels orders, protected traders show up here.
                </TD>
              </TR>
            ) : (
              rows.map((r) => (
                <TR key={r.userId}>
                  <TD
                    className={`text-center font-mono font-semibold tabular-nums ${rankColor(
                      r.rank,
                    )}`}
                  >
                    {r.rank}
                  </TD>
                  <TD>
                    <Link
                      href={{
                        pathname: `/traders/${r.userId}`,
                        query: { window: windowKey },
                      }}
                      className="group flex flex-col"
                    >
                      <span className="font-medium text-white group-hover:text-[var(--color-cyan)]">
                        {r.displayName}
                      </span>
                      {r.walletShort && r.walletShort !== r.displayName ? (
                        <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
                          {r.walletShort}
                        </span>
                      ) : null}
                    </Link>
                  </TD>
                  <TD className="text-right font-mono tabular-nums text-[var(--color-green)]">
                    {formatUsd(r.savedUsd, { compact: true })}
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {formatNumber(r.protections)}
                  </TD>
                  <TD className="text-right">
                    {r.staleCancels > 0 ? (
                      <Badge variant="info">{r.staleCancels}</Badge>
                    ) : (
                      <span className="text-[var(--color-fg-dim)]">—</span>
                    )}
                  </TD>
                  <TD className="text-right font-mono tabular-nums text-[var(--color-fg-muted)]">
                    {r.marketsCount}
                  </TD>
                  <TD className="font-mono text-xs text-[var(--color-fg-muted)]">
                    {r.topMarket ?? "—"}
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
