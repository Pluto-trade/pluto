/**
 * useMockRecentTrades
 *
 * Seeds the trading store with historical trades on mount, then streams a new
 * trade every ~600 ms to simulate live activity — no backend required.
 */

import { useEffect, useRef } from "react";
import type { Trade } from "@/types/trading";
import { useTradingStore } from "@/store/tradingStore";

// ─── Tuning ───────────────────────────────────────────────────────────────────

const BASE_PRICE      = 83_420.5;
const SEED_COUNT      = 40;          // trades pre-loaded on mount
const INTERVAL_MS     = 600;         // new trade every N ms
const PRICE_VARIANCE  = 80;          // ± range around base price

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 1;

function uid() {
  return `mock-${idCounter++}`;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomSide(): "BUY" | "SELL" {
  return Math.random() > 0.5 ? "BUY" : "SELL";
}

function randomSize(): number {
  // Occasionally a whale order
  if (Math.random() < 0.05) return parseFloat(rand(10, 80).toFixed(2));
  return parseFloat(rand(0.01, 6).toFixed(4));
}

function makeTrade(symbol: string, offsetMs = 0): Trade {
  const price = parseFloat(
    (BASE_PRICE + rand(-PRICE_VARIANCE, PRICE_VARIANCE)).toFixed(2),
  );
  return {
    id: uid(),
    symbol,
    price,
    size: randomSize(),
    side: randomSide(),
    timestamp: Date.now() - offsetMs,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMockRecentTrades() {
  const selectedSymbol = useTradingStore((state) => state.selectedSymbol);
  const addRecentTrade = useTradingStore((state) => state.addRecentTrade);
  const clearTrades = useTradingStore((state) => state.clearTrades);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any previous trades and seed with history
    clearTrades();

    // Seed oldest → newest so the list renders newest-first
    for (let i = SEED_COUNT; i >= 0; i--) {
      // Space seed trades ~5 s apart going back in time
      addRecentTrade(makeTrade(selectedSymbol, i * 5_000));
    }

    // Stream live trades
    intervalRef.current = setInterval(() => {
      addRecentTrade(makeTrade(selectedSymbol));
    }, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedSymbol, addRecentTrade, clearTrades]);
}
