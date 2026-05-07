"use client";

import { useTradingStore } from '@/store/tradingStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { OrderBook } from './components/orderBook';
import { RecentTrades } from './components/recentTrades';
import { MarketComponent } from './components/marketComponent';
import { MarketStats } from './components/marketStats';
import { Button } from '../ui/button';
import { TradingChart } from './components/charts/charts';

// ============ PLACEHOLDER COMPONENTS ============

export const LeftPanel = () => {
  return (
    <div className="grid grid-rows-[60%_40%] w-67.5 h-full gap-4 p-4 shrink-0">
      <MarketComponent />
      <MarketStats />
    </div>
  );
};

export const ChartPanel = () => {
  const { selectedTimeframe, setTimeframe } = useTradingStore();

  return (
    <div className="flex flex-col rounded-xl border-r border-[#1e222d] bg-[#081126]/90 p-2 h-full">
      {/* Timeframe Selector */}
      <div className="flex gap-1 p-4 border-b border-slate-700">
        {(["1m", "5m", "15m", "1h", "4h", "1d"] as const).map(
          (tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs rounded transition ${
                selectedTimeframe === tf
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {tf}
            </button>
          ),
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-hidden p-4">
        <TradingChart />
      </div>
    </div>
  );
};

export const OrderBookPanel = () => {
  return (
    <div className="flex flex-col bg-slate-900 border-r border-slate-700 max-h-96">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase">Order Book</h3>
      </div>

      {/* TODO: Build order book table with asks/bids */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 text-slate-500 text-sm space-y-2">
          <div>Price (USD) | Size | Total</div>
          {/* Placeholder rows */}
          <div className="flex justify-between text-slate-600 text-xs">
            <span>$82,100.00</span>
            <span>1.5254</span>
            <span>125.2k</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs">
            <span>$82,099.50</span>
            <span>0.2359</span>
            <span>19.4k</span>
          </div>
        </div>
      </div>

      {/* Spread Info */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800">
        <div className="text-xs text-slate-400">Spread: $0.50 (0.0006%)</div>
      </div>
    </div>
  );
};

export const RecentTradesPanel = () => {
  return (
    <div className="flex flex-col bg-slate-900 border-r border-slate-700 max-h-96">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase">Recent Trades</h3>
      </div>

      {/* TODO: Build trades table with virtual scrolling */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 text-slate-500 text-sm space-y-2">
          <div className="text-xs grid grid-cols-4 gap-2 pb-2 border-b border-slate-700">
            <span>Time</span>
            <span>Side</span>
            <span>Price</span>
            <span>Size</span>
          </div>

          {recentTrades.length === 0 ? (
            <div className="text-center text-slate-600 py-4">No trades yet</div>
          ) : (
            recentTrades.slice(0, 10).map((trade) => (
              <div
                key={trade.id}
                className={`text-xs grid grid-cols-4 gap-2 py-1 ${
                  trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                <span className="font-semibold">{trade.side}</span>
                <span>${trade.price.toFixed(2)}</span>
                <span>{trade.size.toFixed(4)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const TransactionPanel = () => {
  const { tradePanel, setOrderType, setTradeSide, setPrice, setSize } =
    useTradingStore();

  const handlePlaceOrder = () => {
    // TODO: Integrate with usePlaceOrder mutation
    console.log("Place order:", tradePanel);
  };

  const total = parseFloat(tradePanel.price) * parseFloat(tradePanel.size) || 0;

  return (
    <div className="bg-[#081126]/90 border border-[#1e222d] mx-2 ml-4  rounded-xl p-4 my-2 w-80">
      <div className="space-y-4">
        {/* Order Type Toggle */}
        <div className="flex gap-2">
          {(['LIMIT', 'MARKET'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2 rounded text-sm font-medium transition ${
                tradePanel.orderType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Side Toggle */}
        <div className="flex gap-2">
          {(['BUY', 'SELL'] as const).map((side) => (
            <button
              key={side}
              onClick={() => setTradeSide(side)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tradePanel.side === side
                  ? side === "BUY"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {side}
            </Button>
          ))}
        </div>

        {/* Price Input (only for LIMIT) */}
        {tradePanel.orderType === "LIMIT" && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Price (USD)
            </label>
            <input
              type="number"
              value={tradePanel.price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-600 text-sm"
            />
          </div>
        )}

        {/* Size Input */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">
            Size (BTC)
          </label>
          <input
            type="number"
            value={tradePanel.size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-600 text-sm"
          />
        </div>

        {/* Total */}
        <div className="bg-slate-800 rounded p-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total:</span>
            <span className="text-white font-semibold">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Fee */}
        <div className="text-xs text-slate-400 flex justify-between">
          <span>Est. Fee:</span>
          <span>${(total * 0.0003).toFixed(2)} (0.03%)</span>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          className={`w-full py-3 rounded font-semibold transition ${
            tradePanel.side === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {tradePanel.side} {tradePanel.size || '0'} BTC
        </button>
      </div>
    </div>
  );
};

// ============ BOTTOM SHEET ============
