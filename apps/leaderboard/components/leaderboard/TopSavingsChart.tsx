"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatUsd } from "../../lib/format";
import type { LeaderboardRow } from "../../lib/leaderboard";

const PALETTE = [
  "#00FF88",
  "#00D4FF",
  "#7B4FDB",
  "#C64BFF",
  "#FFB547",
  "#FF3A5A",
  "#B8D4E4",
  "#C8B898",
  "#8A5040",
  "#06B6D4",
];

export function TopSavingsChart({ rows }: { rows: LeaderboardRow[] }) {
  const data = rows.slice(0, 10).map((r, i) => ({
    name: r.displayName,
    saved: Number(r.savedUsd.toFixed(2)),
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Top 10 by savings</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Estimated USD rescued from bad fills
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-fg-dim)]">
              No protections in this window yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
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
                  width={120}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v: number) => [formatUsd(Number(v)), "Saved"]}
                />
                <Bar dataKey="saved" radius={[0, 4, 4, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
