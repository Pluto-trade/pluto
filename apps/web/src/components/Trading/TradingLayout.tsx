'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import {
  LeftPanel,
  ChartPanel,
  OrderBookPanel,
  RecentTradesPanel,
  TransactionPanel,
  BottomSheet,
} from './TradingPanels';

export const TradingLayout = () => {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] mt-1 bg-slate-950">
      {/* Main Content Grid */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL - Pairs & Stats */}
        <div className="">
          <LeftPanel />
        </div>

        {/* CENTER AREA - Chart */}
        <div className="flex-1 flex flex-col">
          <ChartPanel />
        </div>

        {/* RIGHT AREA - OrderBook + Trades + Form */}
        <div className="flex">
          {/* OrderBook + Recent Trades (stacked) */}
          <div className="w-80 flex flex-col">
            <div className="flex-1 overflow-auto">
              <OrderBookPanel />
            </div>
            <div className="flex-1 overflow-auto border-t border-slate-700">
              <RecentTradesPanel />
            </div>
          </div>

          {/* Transaction Form */}
          <TransactionPanel />
        </div>
      </div>

      {/* BOTTOM SHEET - Open Orders, Positions, History */}
      <div className="h-32 overflow-auto">
        <BottomSheet />
      </div>
    </div>
  );
};
