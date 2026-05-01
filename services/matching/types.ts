//Anyone can use these types to interact with the matching engine, but they should not be used internally within the engine's implementation.
export type Side = "buy" | "sell";

export type OrderType = "limit" | "market";

export type OrderStatus =
  | "accepted"
  | "resting"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "rejected";

export interface BaseOrder {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  quantity: number;
  timestamp: number;
}

export interface LimitOrder extends BaseOrder {
  type: "limit";
  price: number;
}

export interface MarketOrder extends BaseOrder {
  type: "market";
  price?: never;
}

export type Order = LimitOrder | MarketOrder;

export interface RestingOrder extends LimitOrder {
  remainingQuantity: number;
  sequenceId: number;
}

export interface Trade {
  tradeId: string;
  symbol: string;
  price: number;
  quantity: number;
  buyOrderId: string;
  sellOrderId: string;
  makerOrderId: string;
  takerOrderId: string;
  timestamp: number;
}

export interface ExecutionReport {
  orderId: string;
  status: OrderStatus;
  filledQuantity: number;
  remainingQuantity: number;
  message?: string;
}

export interface BookLevel {
  price: number;
  totalQuantity: number;
  orderCount: number;
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: BookLevel[];
  asks: BookLevel[];
}

export interface MatchResult {
  trades: Trade[];
  executionReports: ExecutionReport[];
  orderStatus: OrderStatus;
  remainingQuantity: number;
  restingOrder?: RestingOrder;
}

export interface CancelResult {
  found: boolean;
  executionReport: ExecutionReport;
}
