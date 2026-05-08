import { getRedisClient } from ".";
import type { TradeInfo } from "../../types";

const TRADE_LIST_MAX = 1000;

function tradeKey(marketId: string): string {
  return `trades:${marketId}`;
}

export async function addTrade(marketId: string, trade: TradeInfo): Promise<void> {
  const client = getRedisClient();
  const payload = JSON.stringify(trade);
  await client.lPush(tradeKey(marketId), payload);
  await client.lTrim(tradeKey(marketId), 0, TRADE_LIST_MAX - 1);
}

export async function getLatestTrade(marketId: string): Promise<TradeInfo | null> {
  const client = getRedisClient();
  const raw = await client.lIndex(tradeKey(marketId), 0);
  if (!raw) return null;
  return JSON.parse(raw) as TradeInfo;
}

export async function getVolume24h(marketId: string, now = Date.now()): Promise<number> {
  const client = getRedisClient();
  const rawTrades = await client.lRange(tradeKey(marketId), 0, -1);
  const cutoff = now - 24 * 60 * 60 * 1000;
  let total = 0;
  for (const raw of rawTrades) {
    const trade = JSON.parse(raw) as TradeInfo;
    if (trade.timestamp >= cutoff) {
      total += trade.size;
    }
  }
  return total;
}

export async function getStats24h(
  marketId: string,
  now = Date.now(),
): Promise<{ volume: number; high: number | null; low: number | null }> {
  const client = getRedisClient();
  const rawTrades = await client.lRange(tradeKey(marketId), 0, -1);
  const cutoff = now - 24 * 60 * 60 * 1000;
  let volume = 0;
  let high: number | null = null;
  let low: number | null = null;

  for (const raw of rawTrades) {
    const trade = JSON.parse(raw) as TradeInfo;
    if (trade.timestamp < cutoff) continue;
    volume += trade.size;
    if (high === null || trade.price > high) high = trade.price;
    if (low === null || trade.price < low) low = trade.price;
  }

  return { volume, high, low };
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export async function getCandles(
  marketId: string,
  intervalMs: number = 60 * 1000, // default 1m
  limit: number = 1000
): Promise<Candle[]> {
  const client = getRedisClient();
  const rawTrades = await client.lRange(tradeKey(marketId), 0, -1);
  
  if (rawTrades.length === 0) return [];

  const trades = rawTrades.map(raw => JSON.parse(raw) as TradeInfo).reverse();
  const candlesMap = new Map<number, Candle>();

  for (const trade of trades) {
    const candleTime = Math.floor(trade.timestamp / intervalMs) * intervalMs;
    const existing = candlesMap.get(candleTime);

    if (!existing) {
      candlesMap.set(candleTime, {
        time: candleTime / 1000, // seconds for lightweight-charts
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
      });
    } else {
      existing.high = Math.max(existing.high, trade.price);
      existing.low = Math.min(existing.low, trade.price);
      existing.close = trade.price;
    }
  }

  return Array.from(candlesMap.values()).sort((a, b) => a.time - b.time).slice(-limit);
}
