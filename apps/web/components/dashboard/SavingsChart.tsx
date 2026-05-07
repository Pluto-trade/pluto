"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatUsd } from "../../lib/format";
import type { TimeseriesPoint } from "../../lib/mpe";

function formatBucket(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function SavingsChart({
  points,
  windowHours,
}: {
  points: TimeseriesPoint[];
  windowHours: number;
}) {
  const data = points.map((p) => ({
    t: formatBucket(p.bucket),
    saved: Number(p.savedUsd.toFixed(2)),
    cancelled: p.cancelled,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Estimated savings</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
            Aggregated USD value MPE rescued from bad fills · last {windowHours}h
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FF88" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="t"
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis
                width={60}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatUsd(v, { compact: true })}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
                formatter={(value: number, name) =>
                  name === "saved"
                    ? [formatUsd(Number(value)), "Saved"]
                    : [value, "Cancelled"]
                }
              />
              <Area
                type="monotone"
                dataKey="saved"
                stroke="#00FF88"
                strokeWidth={2}
                fill="url(#savedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
