"use client";

import { useTradingStore } from "@/store/tradingStore";
import type { OrderBookLevel } from "@/types/trading";
import { useMemo } from "react";

// rows tro display at once per side (asks/bids)
const DISPLAY_ROWS = 10;
interface RowData extends OrderBookLevel {
  /** Running cumulative size from the spread outward */
  total: number;
  /** Bar width as a percentage of the max total across both sides */
  barPct: number;
  /** Stable React key */
  rowKey: string;
}

function buildRows(
  levels: OrderBookLevel[],
  side: "ask" | "bid",
  maxTotal: number,
): RowData[] {
  let running = 0;
  return levels.map((lvl) => {
    running += lvl.size;
    return {
      ...lvl,
      total: running,
      barPct: maxTotal > 0 ? (running / maxTotal) * 100 : 0,
      rowKey: `${side}-${lvl.price}`,
    };
  });
}

function formatPrice(price: number) {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSize(size: number) {
  return size.toFixed(4);
}

// ─── Row component ────────────────────────────────────────────────────────────

interface OrderRowProps {
  row: RowData;
  side: "ask" | "bid";
}

const OrderRow = ({ row, side }: OrderRowProps) => {
  const isBid = side === "bid";

  return (
    <div className="relative flex items-center h-6.5 cursor-pointer group select-none">
      {/* ── Depth bar: animates width smoothly, single colour per side ── */}
      <div
        className={`absolute top-0 right-0 h-full transition-[width] duration-300 ease-out ${
          isBid ? "bg-green-500/13" : "bg-red-500/13"
        }`}
        style={{ width: `${Math.min(row.barPct, 100)}%` }}
      />

      {/* ── Hover highlight ───────────────────────────────── */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/3" />

      {/* ── Text content ──────────────────────────────────── */}
      <div className="relative z-10 flex w-full px-3 text-[11px] font-mono tabular-nums">
        <span
          className={`flex-1 font-medium ${isBid ? "text-green-400" : "text-red-400"}`}
        >
          {formatPrice(row.price)}
        </span>
        <span className="flex-1 text-right text-slate-300">
          {formatSize(row.size)}
        </span>
        <span className="flex-1 text-right text-slate-500">
          {formatSize(row.total)}
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const OrderBook = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const { orderBook } = useTradingStore();

  // ── Compute display rows ─────────────────────────────────────────────────
  const { displayAsks, displayBids, spread, spreadPct } = useMemo(() => {
    if (!orderBook) {
      return { displayAsks: [], displayBids: [], spread: 0, spreadPct: 0 };
    }

    // Asks: sort ascending (lowest ask first = closest to spread)
    const rawAsks = [...orderBook.asks]
      .sort((a, b) => a.price - b.price)
      .slice(0, DISPLAY_ROWS);

    // Bids: sort descending (highest bid first = closest to spread)
    const rawBids = [...orderBook.bids]
      .sort((a, b) => b.price - a.price)
      .slice(0, DISPLAY_ROWS);

    const askMaxTotal = rawAsks.reduce((s, l) => s + l.size, 0);
    const bidMaxTotal = rawBids.reduce((s, l) => s + l.size, 0);
    const maxTotal = Math.max(askMaxTotal, bidMaxTotal, 1);

    const enrichedAsks = buildRows(rawAsks, "ask", maxTotal);
    const enrichedBids = buildRows(rawBids, "bid", maxTotal);

    const bestAsk = rawAsks[0]?.price ?? 0;
    const bestBid = rawBids[0]?.price ?? 0;
    const spread = Math.max(0, bestAsk - bestBid);
    const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    return {
      // Reverse asks so lowest ask sits closest to the spread row
      displayAsks: [...enrichedAsks].reverse(),
      displayBids: enrichedBids,
      spread,
      spreadPct,
    };
  }, [orderBook]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (!orderBook) {
    return (
      <div className="flex items-center justify-center h-full border border-[#1e222d] bg-[#081126]/90 rounded-lg shadow-lg backdrop-blur-xl">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-slate-500">Loading order book…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border border-[#1e222d] bg-[#081126]/90  shadow-lg backdrop-blur-xl overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e222d] shrink-0">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Order Book
          </h3>
          <span className="text-[10px] text-slate-600">{orderBook.symbol}</span>
        </div>
      )}

      {/* ── Column labels ───────────────────────────────────────────────── */}
      <div className="flex px-3 py-1 text-[10px] text-slate-600 font-medium border-b border-[#1e222d]/60 shrink-0 select-none">
        <span className="flex-1">Price (USD)</span>
        <span className="flex-1 text-right">Size</span>
        <span className="flex-1 text-right">Total</span>
      </div>

      {/* ── Asks — only red ─────────────────────────────────────────────── */}
      <div className="flex flex-col shrink-0">
        {displayAsks.map((row) => (
          <OrderRow key={row.rowKey} row={row} side="ask" />
        ))}
      </div>

      {/* ── Spread ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-1.25 border-y border-[#1e222d] bg-[#0a1628]/80 shrink-0">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
          Spread
        </span>
        <span className="text-[11px] font-mono tabular-nums text-slate-300">
          ${formatPrice(spread)}
        </span>
        <span className="text-[10px] font-mono tabular-nums text-slate-600 ml-auto">
          {spreadPct.toFixed(4)}%
        </span>
      </div>

      {/* ── Bids — only green ───────────────────────────────────────────── */}
      <div className="flex flex-col shrink-0">
        {displayBids.map((row) => (
          <OrderRow key={row.rowKey} row={row} side="bid" />
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-auto px-3 py-1.5 border-t border-[#1e222d] flex items-center gap-1.5 shrink-0">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] text-slate-600">Live</span>
      </div>
    </div>
  );
};
