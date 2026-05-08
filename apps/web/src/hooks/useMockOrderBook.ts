/**
 * useMockOrderBook
 *
 * Simulates a live orderbook feed by periodically mutating prices and sizes
 * and pushing updates into the trading store — so the real OrderBook component
 * can render without a backend connection.
 */

import { useEffect, useRef } from "react";
import type { OrderBook, OrderBookLevel } from "@/types/trading";
import { useTradingStore } from "@/store/tradingStore";

// ─── Tuning knobs ──────────────────────────────────────────────────────────────

const MID_PRICE = 83_420.5;    // starting mid-market price
const TICK_SIZE = 0.5;          // price increment between levels
const NUM_LEVELS = 15;          // depth levels per side
const UPDATE_INTERVAL_MS = 350; // how often to push an update
const PRICE_DRIFT_EVERY = 6;    // shift mid price every N ticks
const MAX_DRIFT = 5;            // max dollars to drift per shift

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

/** Build a fresh side of the book from a given starting price outward */
function buildSide(
  midPrice: number,
  side: "ask" | "bid",
  levels: number,
): OrderBookLevel[] {
  return Array.from({ length: levels }, (_, i) => {
    const offset = (i + 1) * TICK_SIZE;
    const price =
      side === "ask"
        ? parseFloat((midPrice + offset).toFixed(2))
        : parseFloat((midPrice - offset).toFixed(2));
    return { price, size: parseFloat(rand(0.05, 6).toFixed(4)) };
  });
}

/** Mutate a snapshot: randomly tweak a handful of sizes, keep prices stable */
function mutateBook(book: OrderBook, midPrice: number): OrderBook {
  const mutateSide = (levels: OrderBookLevel[]): OrderBookLevel[] =>
    levels.map((lvl) => {
      // ~40% chance of changing each level's size this tick
      if (Math.random() > 0.4) return lvl;
      const delta = rand(-1.5, 1.5);
      const newSize = Math.max(0.01, lvl.size + delta);
      return { ...lvl, size: parseFloat(newSize.toFixed(4)) };
    });

  return {
    ...book,
    asks: mutateSide(book.asks),
    bids: mutateSide(book.bids),
    timestamp: Date.now(),
  };
}

/** Rebuild the price ladder when mid drifts */
function rebuildBook(midPrice: number, symbol: string): OrderBook {
  return {
    symbol,
    asks: buildSide(midPrice, "ask", NUM_LEVELS),
    bids: buildSide(midPrice, "bid", NUM_LEVELS),
    timestamp: Date.now(),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMockOrderBook() {
  const { selectedSymbol, setOrderBook } = useTradingStore();

  const midRef = useRef(MID_PRICE);
  const bookRef = useRef<OrderBook>(rebuildBook(MID_PRICE, selectedSymbol));
  const tickRef = useRef(0);

  useEffect(() => {
    // Seed the store immediately so there's no loading flash
    setOrderBook(bookRef.current);

    const id = setInterval(() => {
      tickRef.current += 1;

      // Every N ticks, drift the mid price and rebuild the ladder
      if (tickRef.current % PRICE_DRIFT_EVERY === 0) {
        const drift = rand(-MAX_DRIFT, MAX_DRIFT);
        midRef.current = parseFloat((midRef.current + drift).toFixed(2));
        bookRef.current = rebuildBook(midRef.current, selectedSymbol);
      } else {
        // Otherwise just tweak sizes in place
        bookRef.current = mutateBook(bookRef.current, midRef.current);
      }

      setOrderBook(bookRef.current);
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [selectedSymbol, setOrderBook]);
}
