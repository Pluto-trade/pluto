import { create } from "zustand";
import type {
  ApiMarket,
  Market,
  OrderBook,
  Trade,
  Order,
  OrderType,
} from "@/types/trading";

interface TradingState {
  // User Data
  userId: string | null;
  setUserId: (id: string | null) => void;

  // Selected Market
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  selectedMarketId: string | null;
  setSelectedMarketId: (id: string) => void;

  // OrderBook Data (WebSocket)
  orderBook: OrderBook | null;
  setOrderBook: (orderBook: OrderBook) => void;

  // Recent Trades (WebSocket)
  recentTrades: Trade[];
  setRecentTrades: (trades: Trade[]) => void;
  addRecentTrade: (trade: Trade) => void;
  addRecentTrades: (trades: Trade[]) => void;
  clearTrades: () => void;

  // Price Ticker (WebSocket)
  currentMarket: Market | null;
  setCurrentMarket: (market: Market) => void;

  // Trading Form State (UI)
  tradePanel: {
    orderType: OrderType;
    side: "BUY" | "SELL";
    price: string;
    size: string;
  };
  setOrderType: (type: OrderType) => void;
  setTradeSide: (side: "BUY" | "SELL") => void;
  setPrice: (price: string) => void;
  setSize: (size: string) => void;
  resetTradePanel: () => void;

  // Chart State
  selectedTimeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  setTimeframe: (tf: "1m" | "5m" | "15m" | "1h" | "4h" | "1d") => void;

  // WebSocket Connection Status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

const initialTradePanel = {
  orderType: "LIMIT" as const,
  side: "BUY" as const,
  price: "",
  size: "",
};

function getTradeKey(trade: Trade) {
  return trade.id || `${trade.symbol}:${trade.price}:${trade.size}:${trade.timestamp}`;
}

function uniqueTrades(trades: Trade[]) {
  const seen = new Set<string>();
  const deduped: Trade[] = [];

  for (const trade of trades) {
    const key = getTradeKey(trade);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(trade);
  }

  return deduped;
}

export const useTradingStore = create<TradingState>((set) => ({
  // User Data
  userId: null,
  setUserId: (userId) => {
    if (typeof window !== "undefined") {
      if (userId) {
        window.localStorage.setItem("plut0x:userId", userId);
      } else {
        window.localStorage.removeItem("plut0x:userId");
      }
    }
    set({ userId });
  },

  // Market Selection
  selectedSymbol: "BTC-PERP",
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  selectedMarketId: null,
  setSelectedMarketId: (id) =>
    set({
      selectedMarketId: id,
      orderBook: null,
      recentTrades: [],
      currentMarket: null,
    }),

  // OrderBook
  orderBook: null,
  setOrderBook: (orderBook) => set({ orderBook }),

  // Recent Trades
  recentTrades: [],
  setRecentTrades: (recentTrades) => set({ recentTrades: uniqueTrades(recentTrades) }),
  addRecentTrade: (trade) =>
    set((state) => {
      const tradeKey = getTradeKey(trade);
      const alreadyExists = state.recentTrades.some((item) => getTradeKey(item) === tradeKey);

      if (alreadyExists) return state;

      return {
        recentTrades: [trade, ...state.recentTrades].slice(0, 50),
      };
    }),
  addRecentTrades: (trades) =>
    set((state) => {
      if (trades.length === 0) return state;

      const seen = new Set(state.recentTrades.map(getTradeKey));
      const newTrades: Trade[] = [];

      for (const trade of trades) {
        const key = getTradeKey(trade);
        if (seen.has(key)) continue;
        seen.add(key);
        newTrades.push(trade);
      }

      if (newTrades.length === 0) return state;

      return {
        recentTrades: [...newTrades, ...state.recentTrades].slice(0, 50),
      };
    }),
  clearTrades: () => set({ recentTrades: [] }),

  // Market Data
  currentMarket: null,
  setCurrentMarket: (market) => set({ currentMarket: market }),

  // Trade Panel
  tradePanel: initialTradePanel,
  setOrderType: (orderType) =>
    set((state) => ({
      tradePanel: { ...state.tradePanel, orderType },
    })),
  setTradeSide: (side) =>
    set((state) => ({
      tradePanel: { ...state.tradePanel, side },
    })),
  setPrice: (price) =>
    set((state) => ({
      tradePanel: { ...state.tradePanel, price },
    })),
  setSize: (size) =>
    set((state) => ({
      tradePanel: { ...state.tradePanel, size },
    })),
  resetTradePanel: () => set({ tradePanel: initialTradePanel }),

  // Chart
  selectedTimeframe: "1h",
  setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

  // WebSocket
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
