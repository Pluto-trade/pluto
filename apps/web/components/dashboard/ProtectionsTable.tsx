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
import type { ProtectionRow } from "../../lib/mpe";

function reasonLabel(r: string) {
  return r
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ProtectionsTable({ rows }: { rows: ProtectionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent protected orders</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Latest decisions from the matching pre-engine
          </p>
        </div>
        <Badge variant="info">{rows.length} rows</Badge>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>Order</TH>
              <TH>Market</TH>
              <TH>Side</TH>
              <TH className="text-right">Size</TH>
              <TH className="text-right">Deviation</TH>
              <TH>Reason</TH>
              <TH>Decision</TH>
              <TH className="text-right">Saved</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <TR>
                <TD
                  colSpan={9}
                  className="py-10 text-center text-sm text-[var(--color-fg-dim)]"
                >
                  No protection decisions yet. Once orders flow through MPE,
                  they'll appear here.
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
                  <TD>
                    <Badge variant={r.side === "BUY" ? "info" : "warn"}>
                      {r.side}
                    </Badge>
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {formatNumber(r.size)}
                  </TD>
                  <TD className="text-right font-mono tabular-nums text-[var(--color-fg-muted)]">
                    {r.priceDeviation == null
                      ? "—"
                      : formatPercent(r.priceDeviation, 2)}
                  </TD>
                  <TD className="text-[var(--color-fg-muted)]">
                    {reasonLabel(r.reason)}
                  </TD>
                  <TD>
                    <Badge
                      variant={r.decision === "CANCEL" ? "cancel" : "allow"}
                    >
                      {r.decision}
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
