"use client";

import { useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { LeftPanel, ChartPanel, TransactionPanel } from "./chartPanel";
import { BottomSheet } from "./bottomPanel";
import { OrderBook } from "./components/orderbook";
import { RecentTrades } from "./components/recentTrades";

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "orderbook" | "trades";

const TABS: { id: Tab; label: string }[] = [
  { id: "orderbook", label: "Order Book" },
  { id: "trades", label: "Trades" },
];

// ─── MarketPanel ──────────────────────────────────────────────────────────────

const MarketPanel = () => {
  const [active, setActive] = useState<Tab>("orderbook");

  return (
    <div className="flex flex-col h-full border border-[#1e222d] bg-[#081126]/90 rounded-lg shadow-lg backdrop-blur-xl overflow-hidden">
      {/* ── Tab strip (replaces the individual h3 headers) ── */}
      <div className="flex items-center border-b border-[#1e222d] shrink-0">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`relative px-5 py-2.5 text-[12px] font-medium tracking-wide transition-colors cursor-pointer select-none ${
                isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
              {/* Teal underline indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--cyan) rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/*
        Both panels sit in the same grid cell ([grid-area:1/1]).
        The cell height = max(orderbook, trades) — always constant.
        The inactive panel is invisible + non-interactive but still occupies space,
        so switching tabs never causes a height jump.
      */}
      <div className="grid overflow-hidden">
        <div
          className={`[grid-area:1/1] overflow-hidden transition-opacity duration-150 ${
            active === "orderbook"
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <OrderBook hideHeader />
        </div>
        <div
          className={`[grid-area:1/1] overflow-hidden transition-opacity duration-150 ${
            active === "trades"
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <RecentTrades hideHeader />
        </div>
      </div>
    </div>
  );
};

// ─── TradingLayout ────────────────────────────────────────────────────────────

export const TradingLayout = () => {
  useWebSocket();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] mt-1 bg-slate-950">
      {/* Main Content Grid */}
      <div className="flex flex-1">
        {/* LEFT PANEL - Pairs & Stats */}
        <div className="w-48">
          <LeftPanel />
        </div>*/}

        {/* CENTER - Chart */}
        <div className="flex-1 flex flex-col mt-4">
          <ChartPanel />
        </div>

        {/* RIGHT AREA - OrderBook + Trades + Form */}
        <div className="flex">
          {/* OrderBook + Recent Trades (stacked) */}
          <div className="w-80 flex flex-col">
            <div className="flex-1 overflow-auto rounded-xl">
              <OrderBookPanel />
              <RecentTradesPanel />
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET - Open Orders, Positions, History */}
      <div className="h-32 overflow-auto">
        <BottomSheet />
      </div>
    </div>
  );
};
