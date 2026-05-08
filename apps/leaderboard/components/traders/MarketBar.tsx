"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatUsd } from "../../lib/format";

export function MarketBar({
  data,
}: {
  data: Array<{ market: string; protections: number; savedUsd: number }>;
}) {
  const rows = data.map((d) => ({
    name: d.market,
    saved: Number(d.savedUsd.toFixed(2)),
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Protections by market</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            USD saved per market in this window
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-fg-dim)]">
              No market activity in this window
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatUsd(v, { compact: true })}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v: number) => [formatUsd(Number(v)), "Saved"]}
                />
                <Bar dataKey="saved" fill="#00FF88" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
