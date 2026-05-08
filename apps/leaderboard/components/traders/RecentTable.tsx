import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "../ui/Table";
import {
  formatNumber,
  formatPercent,
  formatRelative,
  formatUsd,
  shortId,
} from "../../lib/format";
import type { TraderProtectionRow } from "../../lib/leaderboard";

const STALE = new Set(["STRONG_STALE", "DELAY", "DELAY_HIGH_VOL"]);

function reasonLabel(r: string) {
  return r
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function RecentTable({ rows }: { rows: TraderProtectionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent protections</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Most recent decisions for this trader
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>Order</TH>
              <TH>Market</TH>
              <TH className="text-right">Size</TH>
              <TH className="text-right">Deviation</TH>
              <TH>Reason</TH>
              <TH className="text-right">Saved</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <TR>
                <TD
                  colSpan={7}
                  className="py-10 text-center text-sm text-[var(--color-fg-dim)]"
                >
                  No protections for this trader in the selected window.
                </TD>
              </TR>
            ) : (
              rows.map((r) => (
                <TR key={r.id}>
                  <TD className="whitespace-nowrap text-[var(--color-fg-muted)]">
                    {formatRelative(r.createdAt)}
                  </TD>
                  <TD className="font-mono text-xs text-[var(--color-fg-muted)]">
                    {shortId(r.takerOrderId)}
                  </TD>
                  <TD className="font-mono text-xs">{r.marketSymbol}</TD>
                  <TD className="text-right font-mono tabular-nums">
                    {formatNumber(r.size)}
                  </TD>
                  <TD className="text-right font-mono tabular-nums text-[var(--color-fg-muted)]">
                    {r.priceDeviation == null
                      ? "—"
                      : formatPercent(r.priceDeviation, 2)}
                  </TD>
                  <TD>
                    <Badge variant={STALE.has(r.reason) ? "info" : "warn"}>
                      {reasonLabel(r.reason)}
                    </Badge>
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {r.savedUsd > 0 ? (
                      <span className="text-[var(--color-green)]">
                        {formatUsd(r.savedUsd)}
                      </span>
                    ) : (
                      <span className="text-[var(--color-fg-dim)]">—</span>
                    )}
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
