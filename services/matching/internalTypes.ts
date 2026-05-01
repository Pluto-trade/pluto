import type { RestingOrder, Side } from "./types.ts";
//internal types for mathcing eng
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
