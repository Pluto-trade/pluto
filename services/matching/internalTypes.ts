import type { RestingOrder, Side } from "./types.ts";

export interface OrderBookSide {
  levels: Map<number, RestingOrder[]>;
}

export interface SymbolOrderBook {
  bids: OrderBookSide;
  asks: OrderBookSide;
}

export interface IndexedOrder {
  order: RestingOrder;
  side: Side;
}
