import { create } from 'zustand';
import type { Market, OrderBook, Trade, Order, OrderType } from '@/types/trading';

interface TradingState {
  // Selected Market
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;

  // OrderBook Data (WebSocket)
  orderBook: OrderBook | null;
  setOrderBook: (orderBook: OrderBook) => void;

  // Recent Trades (WebSocket)
  recentTrades: Trade[];
  addRecentTrade: (trade: Trade) => void;
  clearTrades: () => void;

  // Price Ticker (WebSocket)
  currentMarket: Market | null;
  setCurrentMarket: (market: Market) => void;

  // Trading Form State (UI)
  tradePanel: {
    orderType: OrderType;
    side: 'BUY' | 'SELL';
    price: string;
    size: string;
  };
  setOrderType: (type: OrderType) => void;
  setTradeSide: (side: 'BUY' | 'SELL') => void;
  setPrice: (price: string) => void;
  setSize: (size: string) => void;
  resetTradePanel: () => void;

  // Chart State
  selectedTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  setTimeframe: (tf: '1m' | '5m' | '15m' | '1h' | '4h' | '1d') => void;

  // WebSocket Connection Status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

const initialTradePanel = {
  orderType: 'LIMIT' as const,
  side: 'BUY' as const,
  price: '',
  size: '',
};

export const useTradingStore = create<TradingState>((set) => ({
  // Market Selection
  selectedSymbol: 'BTC-PERP',
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  // OrderBook
  orderBook: null,
  setOrderBook: (orderBook) => set({ orderBook }),

  // Recent Trades
  recentTrades: [],
  addRecentTrade: (trade) =>
    set((state) => ({
      recentTrades: [trade, ...state.recentTrades].slice(0, 50), // Keep last 50
    })),
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
  selectedTimeframe: '1h',
  setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

  // WebSocket
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
