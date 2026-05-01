import type { OrderBookSnapshot, RestingOrder, Side } from "./types.ts";
//This is the interface that the matching engine uses to interact with the order book. It abstracts away the internal implementation details of the order book, allowing for flexibility in how the order book is implemented and maintained.
export interface OrderBookPort {
  addRestingOrder(order: RestingOrder): void;
  deletePriceLevel(symbol: string, side: Side, price: number): void;
  getBestPrice(symbol: string, side: Side): number | undefined;
  getOrderBookSnapshot(symbol: string): OrderBookSnapshot;
  getQueueAtPrice(
    symbol: string,
    side: Side,
    price: number,
  ): RestingOrder[] | undefined;
}
