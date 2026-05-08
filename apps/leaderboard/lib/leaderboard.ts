import { prisma } from "@repo/database";

type Numeric = { toString(): string } | number | null | undefined;

export const STALE_REASONS = ["STRONG_STALE", "DELAY", "DELAY_HIGH_VOL"] as const;

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

export function windowToHours(window: string | undefined | null): number {
  switch (window) {
    case "24h":
      return 24;
    case "30d":
      return 24 * 30;
    case "7d":
    default:
      return 24 * 7;
  }
}

export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  walletShort: string | null;
  protections: number;
  staleCancels: number;
  savedUsd: number;
  marketsCount: number;
  topMarket: string | null;
};

export type GlobalStats = {
  windowHours: number;
  totalProtections: number;
  staleCancels: number;
  totalSavedUsd: number;
  byReason: Array<{ reason: string; count: number }>;
  topReason: { reason: string; count: number } | null;
  uniqueTraders: number;
};

export type LeaderboardPayload = {
  global: GlobalStats;
  rows: LeaderboardRow[];
};

function shortAddr(addr: string | null | undefined): string | null {
  if (!addr) return null;
  if (addr.length <= 11) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function isStale(reason: string): boolean {
  return (STALE_REASONS as readonly string[]).includes(reason);
}

export async function fetchLeaderboard(
  windowHours: number,
  limit = 50,
): Promise<LeaderboardPayload> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const rows = await prisma.protectionDecisions.findMany({
    where: { createdAt: { gte: since } },
    include: {
      market: { select: { symbol: true, quoteAsset: true } },
      takerOrder: {
        select: {
          userId: true,
          size: true,
          user: {
            select: {
              id: true,
              name: true,
              wallets: { select: { address: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  type Agg = {
    userId: string;
    displayName: string;
    walletShort: string | null;
    protections: number;
    staleCancels: number;
    savedUsd: number;
    markets: Map<string, number>;
    reasons: Map<string, number>;
  };

  const byUser = new Map<string, Agg>();
  const reasonTotals = new Map<string, number>();
  let totalSaved = 0;

  for (const r of rows) {
    const userId = r.takerOrder.userId;
    const user = r.takerOrder.user;
    const wallet = user.wallets[0]?.address ?? null;
    const usdQuote = r.market.quoteAsset?.toUpperCase() === "USDC";
    const saved = usdQuote
      ? estimateSavedUsd(r.priceDeviation, r.takerOrder.size, r.quotePrice)
      : 0;
    totalSaved += saved;
    reasonTotals.set(r.reason, (reasonTotals.get(r.reason) ?? 0) + 1);

    let agg = byUser.get(userId);
    if (!agg) {
      agg = {
        userId,
        displayName: user.name || shortAddr(wallet) || userId.slice(0, 8),
        walletShort: shortAddr(wallet),
        protections: 0,
        staleCancels: 0,
        savedUsd: 0,
        markets: new Map(),
        reasons: new Map(),
      };
      byUser.set(userId, agg);
    }

    agg.protections += 1;
    if (isStale(r.reason)) agg.staleCancels += 1;
    agg.savedUsd += saved;
    agg.markets.set(
      r.market.symbol,
      (agg.markets.get(r.market.symbol) ?? 0) + 1,
    );
    agg.reasons.set(r.reason, (agg.reasons.get(r.reason) ?? 0) + 1);
  }

  const ranked: LeaderboardRow[] = Array.from(byUser.values())
    .sort((a, b) => b.savedUsd - a.savedUsd || b.protections - a.protections)
    .slice(0, limit)
    .map((agg, i) => {
      const topMarket = Array.from(agg.markets.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] ?? null;
      return {
        rank: i + 1,
        userId: agg.userId,
        displayName: agg.displayName,
        walletShort: agg.walletShort,
        protections: agg.protections,
        staleCancels: agg.staleCancels,
        savedUsd: agg.savedUsd,
        marketsCount: agg.markets.size,
        topMarket,
      };
    });

  const byReason = Array.from(reasonTotals.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const staleCancels = byReason
    .filter((r) => isStale(r.reason))
    .reduce((s, r) => s + r.count, 0);

  return {
    global: {
      windowHours,
      totalProtections: rows.length,
      staleCancels,
      totalSavedUsd: totalSaved,
      byReason,
      topReason: byReason[0] ?? null,
      uniqueTraders: byUser.size,
    },
    rows: ranked,
  };
}

export type TraderProtectionRow = {
  id: string;
  takerOrderId: string;
  reason: string;
  marketSymbol: string;
  size: number;
  priceDeviation: number | null;
  quotePrice: number | null;
  quoteAgeMs: number | null;
  savedUsd: number;
  createdAt: string;
};

export type TraderProfile = {
  userId: string;
  displayName: string;
  walletShort: string | null;
  windowHours: number;
  totalProtections: number;
  staleCancels: number;
  savedUsd: number;
  medianSavedAcrossUsers: number;
  multipleOfMedian: number;
  byReason: Array<{ reason: string; count: number }>;
  byMarket: Array<{ market: string; protections: number; savedUsd: number }>;
  recent: TraderProtectionRow[];
};

export async function fetchTraderProfile(
  userId: string,
  windowHours: number,
): Promise<TraderProfile | null> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      wallets: { select: { address: true }, take: 1 },
    },
  });
  if (!userRecord) return null;

  const userRows = await prisma.protectionDecisions.findMany({
    where: {
      createdAt: { gte: since },
      takerOrder: { userId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      market: { select: { symbol: true, quoteAsset: true } },
      takerOrder: { select: { size: true } },
    },
  });

  const byReason = new Map<string, number>();
  const byMarket = new Map<string, { protections: number; savedUsd: number }>();
  let savedUsd = 0;
  let staleCancels = 0;

  const recent: TraderProtectionRow[] = userRows.slice(0, 25).map((r) => {
    const usdQuote = r.market.quoteAsset?.toUpperCase() === "USDC";
    const saved = usdQuote
      ? estimateSavedUsd(r.priceDeviation, r.takerOrder.size, r.quotePrice)
      : 0;
    return {
      id: r.id,
      takerOrderId: r.takerOrderId,
      reason: r.reason,
      marketSymbol: r.market.symbol,
      size: Number(r.takerOrder.size),
      priceDeviation: r.priceDeviation == null ? null : Number(r.priceDeviation),
      quotePrice: r.quotePrice == null ? null : Number(r.quotePrice),
      quoteAgeMs: r.quoteAgeMs ?? null,
      savedUsd: saved,
      createdAt: r.createdAt.toISOString(),
    };
  });

  for (const r of userRows) {
    byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
    if (isStale(r.reason)) staleCancels += 1;
    const usdQuote = r.market.quoteAsset?.toUpperCase() === "USDC";
    const saved = usdQuote
      ? estimateSavedUsd(r.priceDeviation, r.takerOrder.size, r.quotePrice)
      : 0;
    savedUsd += saved;
    const m = byMarket.get(r.market.symbol) ?? { protections: 0, savedUsd: 0 };
    m.protections += 1;
    m.savedUsd += saved;
    byMarket.set(r.market.symbol, m);
  }

  // median savings across all users in window for the comparison line
  const lb = await fetchLeaderboard(windowHours, 1000);
  const sortedSavings = lb.rows.map((r) => r.savedUsd).sort((a, b) => a - b);
  const medianSaved =
    sortedSavings.length === 0
      ? 0
      : sortedSavings.length % 2 === 1
        ? sortedSavings[(sortedSavings.length - 1) / 2]!
        : (sortedSavings[sortedSavings.length / 2 - 1]! +
            sortedSavings[sortedSavings.length / 2]!) /
          2;

  const wallet = userRecord.wallets[0]?.address ?? null;

  return {
    userId,
    displayName:
      userRecord.name || shortAddr(wallet) || userId.slice(0, 8),
    walletShort: shortAddr(wallet),
    windowHours,
    totalProtections: userRows.length,
    staleCancels,
    savedUsd,
    medianSavedAcrossUsers: medianSaved,
    multipleOfMedian: medianSaved > 0 ? savedUsd / medianSaved : 0,
    byReason: Array.from(byReason.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    byMarket: Array.from(byMarket.entries())
      .map(([market, agg]) => ({ market, ...agg }))
      .sort((a, b) => b.savedUsd - a.savedUsd || b.protections - a.protections),
    recent,
  };
}
