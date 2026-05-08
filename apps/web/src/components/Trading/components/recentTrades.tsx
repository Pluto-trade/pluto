"use client";

import { useTradingStore } from "@/store/tradingStore";
import { useMockRecentTrades } from "@/hooks/useMockRecentTrades";
import type { Trade } from "@/types/trading";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQty(size: number) {
  // If it's a whole-ish number show fewer decimals
  return size >= 10 ? size.toFixed(2) : size.toFixed(4);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ─── Trade Row ────────────────────────────────────────────────────────────────

const TradeRow = ({ trade }: { trade: Trade }) => {
  const isBuy = trade.side === "BUY";

  return (
    <div className="flex items-center px-3 h-5.5 group hover:bg-white/2 transition-colors select-none">
      {/* Price */}
      <span
        className={`w-[38%] font-mono text-[11px] tabular-nums font-medium ${
          isBuy ? "text-green-400" : "text-red-400"
        }`}
      >
        {formatPrice(trade.price)}
      </span>

      {/* Qty */}
      <span className="w-[32%] text-right font-mono text-[11px] tabular-nums text-slate-300">
        {formatQty(trade.size)}
      </span>

      {/* Time */}
      <span className="w-[30%] text-right font-mono text-[11px] tabular-nums text-slate-500">
        {formatTime(trade.timestamp)}
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const RecentTrades = ({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) => {
  // Swap for real WS feed in production
  useMockRecentTrades();

  const { recentTrades, selectedSymbol } = useTradingStore();

  return (
    <div className="flex flex-col h-full border border-[#1e222d] bg-[#081126]/90  shadow-lg backdrop-blur-xl overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e222d] shrink-0">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Recent Trades
          </h3>
          <span className="text-[10px] text-slate-600">{selectedSymbol}</span>
        </div>
      )}

      {/* ── Column labels ───────────────────────────────────────────────── */}
      <div className="flex items-center px-3 py-1 border-b border-[#1e222d]/60 shrink-0 select-none">
        <span className="w-[38%] text-[10px] text-slate-600 font-medium">
          Price (USD)
        </span>
        <span className="w-[32%] text-right text-[10px] text-slate-600 font-medium">
          Qty (BTC)
        </span>
        <span className="w-[30%] text-right text-[10px] text-slate-600 font-medium">
          Time
        </span>
      </div>

      {/* ── Scrollable trade list ────────────────────────────────────────── */}
      <div className="h-140 overflow-y-auto overflow-x-hidden no-scrollbar">
        {recentTrades.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[11px] text-slate-600">Waiting for trades…</p>
          </div>
        ) : (
          recentTrades.map((trade) => <TradeRow key={trade.id} trade={trade} />)
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-3 py-1.5 border-t border-[#1e222d] flex items-center gap-1.5 shrink-0">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] text-slate-600">Live</span>
      </div>
    </div>
  );
};
