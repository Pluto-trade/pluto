import type { OrderBookSnapshot, RestingOrder, Side } from "./types.ts";

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
