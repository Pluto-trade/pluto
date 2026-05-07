'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderBookLevel } from '@/types/trading';

// --- Mock Data Generator ---
const generateInitialOrders = (basePrice: number, side: 'bid' | 'ask'): OrderBookLevel[] => {
  return Array.from({ length: 15 }, (_, i) => {
    const offset = (i + 1) * (Math.random() * 1.5 + 0.2);
    const price = side === 'ask' ? basePrice + offset : basePrice - offset;
    return {
      price,
      size: Math.random() * 0.8 + 0.05,
    };
  });
};

export function OrderBook() {
  const [midPrice, setMidPrice] = useState(43336.0);
  const [prevPrice, setPrevPrice] = useState(43336.0);
  const [priceChange, setPriceChange] = useState(-2.35);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  // Initialize data
  useEffect(() => {
    setAsks(generateInitialOrders(midPrice, 'ask').sort((a, b) => b.price - a.price));
    setBids(generateInitialOrders(midPrice, 'bid').sort((a, b) => b.price - a.price));
  }, []);

  // Live simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate price fluctuation
      const delta = (Math.random() - 0.5) * 4;
      setMidPrice((prev) => {
        const next = prev + delta;
        if (next > prev) setFlash('up');
        else if (next < prev) setFlash('down');
        setTimeout(() => setFlash(null), 300);
        setPrevPrice(prev);
        return next;
      });
      
      // Update random order sizes
      setAsks((prev) => 
        prev.map(order => Math.random() > 0.6 
          ? { ...order, size: Math.max(0.01, order.size + (Math.random() - 0.5) * 0.15) }
          : order
        ).sort((a, b) => b.price - a.price)
      );

      setBids((prev) => 
        prev.map(order => Math.random() > 0.6 
          ? { ...order, size: Math.max(0.01, order.size + (Math.random() - 0.5) * 0.15) }
          : order
        ).sort((a, b) => b.price - a.price)
      );
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Calculate totals and max volume for depth bars
  const processedAsks = useMemo(() => {
    let total = 0;
    const reversed = [...asks].reverse();
    const withTotals = reversed.map((order) => {
      total += order.size;
      return { ...order, total };
    });
    return withTotals.reverse();
  }, [asks]);

  const processedBids = useMemo(() => {
    let total = 0;
    return bids.map((order) => {
      total += order.size;
      return { ...order, total };
    });
  }, [bids]);

  const maxTotal = useMemo(() => {
    const askTotal = processedAsks.length > 0 ? processedAsks[0].total! : 0;
    const bidTotal = processedBids.length > 0 ? processedBids[processedBids.length - 1].total! : 0;
    return Math.max(askTotal, bidTotal, 1);
  }, [processedAsks, processedBids]);

  return (
    <div className="w-full flex flex-col bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] relative group">
      {/* Premium Glass Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
      
      {/* Header - Tabs */}
      <div className="flex items-center gap-6 px-5 py-3 border-b border-white/5 bg-white/2 relative">
        <button className="text-xs font-bold text-white uppercase tracking-wider relative transition-colors">
          Orders
          <span className="absolute -bottom-[13px] left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
        </button>
        <button className="text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors">
          Trades
        </button>
        
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">BTC / USD</span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
        <span>Price (USD)</span>
        <span className="text-right">Size (BTC)</span>
        <span className="text-right">Total (BTC)</span>
      </div>

      {/* Main Container */}
      <div className="overflow-hidden flex flex-col font-mono text-[11px] selection:bg-indigo-500/30">
        
        {/* Asks (Sell Orders) */}
        <div className="flex flex-col-reverse text-sm justify-end min-h-0">
          {processedAsks.slice(-7).map((order, i) => (
            <OrderRow 
              key={`ask-${order.price}`} 
              order={order} 
              type="ask" 
              maxTotal={maxTotal} 
            />
          ))}
        </div>

        {/* Mid Price Divider / Spread Section */}
        <div className="relative border-y border-white/5 bg-white/[0.02] min-h-[50px] flex items-center px-5">
          <div className="flex items-center mt-2 justify-between w-full relative z-10">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-xl font-black tracking-tighter tabular-nums",
                  midPrice >= prevPrice 
                    ? "text-emerald-400" 
                    : "text-rose-400"
                )}>
                  {midPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider",
                  priceChange >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                </div>
              </div>
            </div>

            <div className="text-right">
              {/* spread amount */}
                <div className="text-sm text-white font-black tabular-nums">0.45</div>
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="flex flex-col min-h-0 text-sm">
          {processedBids.slice(0, 7).map((order, i) => (
            <OrderRow 
              key={`bid-${order.price}`} 
              order={order} 
              type="bid" 
              maxTotal={maxTotal} 
            />
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="px-5 py-2 flex items-center justify-between border-t border-white/5 bg-slate-950/40 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
        <span>Spread: <span className="text-white/60">0.45 (0.00%)</span></span>
        <span>Aggregation: <span className="text-white/60">0.01</span></span>
      </div>
    </div>
  );
}

function OrderRow({ order, type, maxTotal }: { 
  order: OrderBookLevel; 
  type: 'ask' | 'bid'; 
  maxTotal: number 
}) {
  const percentage = (order.total! / maxTotal) * 100;

  return (
    <div className="relative group/row h-6.5 min-h-[26px] flex items-center px-5 transition-all duration-200 hover:bg-white/[0.05] cursor-pointer overflow-hidden">
      {/* Depth Bar Animation */}
      <div 
        className={cn(
          "absolute inset-y-[2px] transition-all duration-1000 ease-out",
          type === 'ask' 
            ? "right-0 bg-rose-500/15 border-r-2 border-rose-500/40 rounded-l-[1px]" 
            : "left-0 bg-emerald-500/15 border-l-2 border-emerald-500/40 rounded-r-[1px]"
        )}
        style={{ width: `${percentage}%` }}
      >
        {/* Shimmer effect inside depth bar */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-r",
          type === 'ask' ? "from-transparent to-rose-400/10" : "from-emerald-400/10 to-transparent"
        )} />
        
        {/* Pulsing glow */}
        <div className={cn(
          "absolute inset-0 animate-pulse opacity-20",
          type === 'ask' ? "bg-rose-400/10" : "bg-emerald-400/10"
        )} />
      </div>

      <div className="grid grid-cols-3 w-full relative z-10 items-center">
        <span className={cn(
          "font-bold transition-all duration-300 tabular-nums tracking-tight",
          type === 'ask' 
            ? "text-rose-400 group-hover/row:text-rose-300 group-hover/row:drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" 
            : "text-emerald-400 group-hover/row:text-emerald-300 group-hover/row:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
        )}>
          {order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-right text-slate-200 font-semibold tabular-nums">
          {order.size.toFixed(4)}
        </span>
        <span className="text-right text-slate-500 font-bold tabular-nums">
          {order.total?.toFixed(4)}
        </span>
      </div>

      {/* Row highlight on hover */}
      <div className="absolute inset-0 opacity-0 group-hover/row:opacity-100 bg-indigo-500/[0.03] transition-opacity pointer-events-none" />
    </div>
  );
}

function MiniSparkline({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path
        d="M0 30 Q 20 10, 40 25 T 80 15 T 100 20"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        className="animate-[shimmer_2s_infinite]"
      />
    </svg>
  );
}
