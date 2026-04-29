export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum MarketStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED',
}

export interface PlaceOrderRequest {
  userId: string;
  marketId: string;
  side: OrderSide;
  size: number;
  price?: number;
  type: OrderType;
  timeInForce?: 'GTC' | 'FOK' | 'IOC';
  postOnly?: boolean;
}

export interface CreateMarketRequest {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  tickSize: number;
  lotSize: number;
  minOrderSize: number;
  pricePrecision: number;
  sizePrecision: number;
  makerFeeRate: number;
  takerFeeRate: number;
}

export interface DepositRequest {
  userId: string;
  asset: string;
  amount: number;
}

export interface WithdrawRequest {
  userId: string;
  asset: string;
  amount: number;
}

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface OrderbookSnapshot {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
}

export interface TradeInfo {
  price: number;
  size: number;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: number;
}

export interface TickerInfo {
  bestBid: number | null;
  bestAsk: number | null;
  lastPrice: number | null;
  volume24h: number;
  timestamp: number;
}
