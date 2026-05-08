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

const PALETTE = ["#00D4FF", "#7B4FDB", "#FFB547", "#FF3A5A", "#00FF88", "#C64BFF"];

function reasonLabel(r: string) {
  return r
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function TraderReasonChart({
  byReason,
}: {
  byReason: Array<{ reason: string; count: number }>;
}) {
  const data = byReason.map((r, i) => ({
    name: reasonLabel(r.reason),
    value: r.count,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Reason breakdown</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Why MPE protected this trader
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-fg-dim)]">
              No protection events in this window
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
                  innerRadius={50}
                  outerRadius={88}
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
