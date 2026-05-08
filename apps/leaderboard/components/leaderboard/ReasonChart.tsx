"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatNumber } from "../../lib/format";
import type { GlobalStats } from "../../lib/leaderboard";

const PALETTE = ["#00D4FF", "#7B4FDB", "#FFB547", "#FF3A5A", "#00FF88", "#C64BFF"];

function reasonLabel(r: string) {
  return r
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ReasonChart({ stats }: { stats: GlobalStats }) {
  const data = stats.byReason.map((r, i) => ({
    name: reasonLabel(r.reason),
    value: r.count,
    color: PALETTE[i % PALETTE.length],
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Reasons</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Why MPE acted in this window
          </p>
        </div>
        <Badge variant="info">{formatNumber(total)} total</Badge>
      </CardHeader>
      <CardContent>
        <div className="relative h-[320px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-fg-dim)]">
              No decisions in this window yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.62)",
                    }}
                  />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={3}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 top-0 flex items-center justify-center pb-8">
                <div className="text-center">
                  <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-white">
                    {formatNumber(total)}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                    Decisions
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
