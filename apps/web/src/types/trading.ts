// Trading Data Types

// Shape returned by GET /markets and GET /markets/:id
export interface ApiMarket {
  id: string;
  symbol: string; // e.g. "SOL-USDC"
  baseAsset: string; // e.g. "SOL"
  quoteAsset: string; // e.g. "USDC"
  tickSize: number;
  lotSize: number;
  minOrderSize: number;
  pricePrecision: number;
  sizePrecision: number;
  makerFeeRate: number;
  takerFeeRate: number;
  status: "ACTIVE" | "PAUSED" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

export interface Market {
  symbol: string;
  name: string;
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total?: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  timestamp: number;
}

export interface UserBalance {
  asset: string;
  available: number;
  locked: number;
  total: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price: number;
  size: number;
  filled: number;
  status: "OPEN" | "FILLED" | "CANCELLED";
  timestamp: number;
}

export interface Position {
  symbol: string;
  side: "LONG" | "SHORT";
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export type OrderType = "LIMIT" | "MARKET";
export type OrderSide = "BUY" | "SELL";
