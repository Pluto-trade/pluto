"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import type { TimeseriesPoint } from "../../lib/mpe";

function formatBucket(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function DecisionsChart({
  points,
  windowHours,
}: {
  points: TimeseriesPoint[];
  windowHours: number;
}) {
  const data = points.map((p) => ({
    t: formatBucket(p.bucket),
    cancelled: p.cancelled,
    allowed: p.allowed,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Decision flow</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Per-bucket allow vs cancel · last {windowHours}h
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="t"
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis width={40} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend
                wrapperStyle={{
                  paddingTop: 8,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.62)",
                }}
              />
              <Bar
                dataKey="allowed"
                stackId="d"
                fill="#00D4FF"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="cancelled"
                stackId="d"
                fill="#FF3A5A"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
