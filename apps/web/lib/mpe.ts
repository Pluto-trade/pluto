import { prisma } from "@repo/database";

type Numeric = { toString(): string } | number | null | undefined;

/**
 * Estimated dollar savings for a CANCEL decision.
 *
 * priceDeviation is a fractional deviation from the fair price (e.g. 0.02 = 2%).
 * If the order had filled at that bad price, the loss vs fair would be roughly:
 *   loss_quote ≈ |priceDeviation| * size * fairPrice
 *
 * Quote asset is assumed USD-pegged (USDC) — surface as an estimate in the UI.
 */
export function estimateSavedUsd(
  priceDeviation: Numeric,
  size: Numeric,
  quotePrice: Numeric,
): number {
  const dev = Number(priceDeviation ?? 0);
  const sz = Number(size ?? 0);
  const px = Number(quotePrice ?? 0);
  if (!dev || !sz || !px) return 0;
  return Math.abs(dev) * sz * px;
}

export type ProtectionRow = {
  id: string;
  orderId: string;
  takerOrderId: string;
  decision: "ALLOW" | "CANCEL";
  reason: string;
  priceDeviation: number | null;
  quotePrice: number | null;
  quoteAgeMs: number | null;
  marketSymbol: string;
  side: "BUY" | "SELL";
  size: number;
  orderPrice: number | null;
  savedUsd: number;
  createdAt: string;
};

export async function fetchRecentProtections(limit = 50): Promise<ProtectionRow[]> {
  const rows = await prisma.protectionDecisions.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      market: { select: { symbol: true } },
      order: { select: { id: true, side: true, size: true, price: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    takerOrderId: r.takerOrderId,
    decision: r.decision,
    reason: r.reason,
    priceDeviation: r.priceDeviation == null ? null : Number(r.priceDeviation),
    quotePrice: r.quotePrice == null ? null : Number(r.quotePrice),
    quoteAgeMs: r.quoteAgeMs ?? null,
    marketSymbol: r.market.symbol,
    side: r.order.side,
    size: Number(r.order.size),
    orderPrice: r.order.price == null ? null : Number(r.order.price),
    savedUsd:
      r.decision === "CANCEL"
        ? estimateSavedUsd(r.priceDeviation, r.order.size, r.quotePrice)
        : 0,
    createdAt: r.createdAt.toISOString(),
  }));
}

export type MpeStats = {
  windowHours: number;
  totalDecisions: number;
  cancelled: number;
  allowed: number;
  protectionRate: number; // cancelled / totalDecisions
  estimatedSavedUsd: number;
  byReason: Array<{ reason: string; count: number }>;
};

export async function fetchStats(windowHours = 24): Promise<MpeStats> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const rows = await prisma.protectionDecisions.findMany({
    where: { createdAt: { gte: since } },
    include: { order: { select: { size: true } } },
  });

  let cancelled = 0;
  let allowed = 0;
  let saved = 0;
  const reasonCounts = new Map<string, number>();

  for (const r of rows) {
    if (r.decision === "CANCEL") {
      cancelled += 1;
      saved += estimateSavedUsd(r.priceDeviation, r.order.size, r.quotePrice);
    } else {
      allowed += 1;
    }
    reasonCounts.set(r.reason, (reasonCounts.get(r.reason) ?? 0) + 1);
  }

  const total = rows.length;
  return {
    windowHours,
    totalDecisions: total,
    cancelled,
    allowed,
    protectionRate: total === 0 ? 0 : cancelled / total,
    estimatedSavedUsd: saved,
    byReason: Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export type TimeseriesPoint = {
  bucket: string; // ISO start of bucket
  cancelled: number;
  allowed: number;
  savedUsd: number;
};

/**
 * Bucket decisions into fixed-width time buckets over the lookback window.
 * Done in JS rather than SQL to stay portable across Prisma adapters.
 */
export async function fetchTimeseries(
  windowHours = 24,
  bucketMinutes = 60,
): Promise<TimeseriesPoint[]> {
  const now = Date.now();
  const since = now - windowHours * 60 * 60 * 1000;
  const bucketMs = bucketMinutes * 60 * 1000;
  const bucketCount = Math.ceil((now - since) / bucketMs);

  const rows = await prisma.protectionDecisions.findMany({
    where: { createdAt: { gte: new Date(since) } },
    include: { order: { select: { size: true } } },
    orderBy: { createdAt: "asc" },
  });

  const buckets: TimeseriesPoint[] = Array.from({ length: bucketCount }, (_, i) => ({
    bucket: new Date(since + i * bucketMs).toISOString(),
    cancelled: 0,
    allowed: 0,
    savedUsd: 0,
  }));

  for (const r of rows) {
    const idx = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((r.createdAt.getTime() - since) / bucketMs)),
    );
    const b = buckets[idx];
    if (!b) continue;
    if (r.decision === "CANCEL") {
      b.cancelled += 1;
      b.savedUsd += estimateSavedUsd(r.priceDeviation, r.order.size, r.quotePrice);
    } else {
      b.allowed += 1;
    }
  }

  return buckets;
}
