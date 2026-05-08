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

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Reasons</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Why MPE acted in this window
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-fg-dim)]">
              No decisions in this window yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.62)" }}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={110}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
