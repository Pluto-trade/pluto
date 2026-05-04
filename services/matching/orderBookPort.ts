import type { OrderBookSnapshot, RestingOrder, Side } from "./types.ts";

/**
 * Storage contract used by the matching engine. The engine holds no order
 * data itself — it asks an `OrderBookPort` implementation for everything
 * it needs and mutates state through head-only operations.
 *
 * Implementations may be in-memory maps (used by tests) or an adapter over
 * `@repo/orderbook.OrderBook` (used by the backend).
 */
export interface OrderBookPort {
  /** Append a resting limit order at its price level (FIFO). */
  addRestingOrder(order: RestingOrder): void;

  /** Best price on the given side, or `undefined` if the side is empty. */
  getBestPrice(symbol: string, side: Side): number | undefined;

  /** Front-of-queue order at the given price level, or `undefined` if empty. */
  peekHead(
    symbol: string,
    side: Side,
    price: number,
  ): RestingOrder | undefined;

  /** Reduce the head order's `remainingQuantity` by `fillQty`. */
  applyFillToHead(
    symbol: string,
    side: Side,
    price: number,
    fillQty: number,
  ): void;

  /** Remove the head order from the queue (used after a full fill). */
  removeHead(symbol: string, side: Side, price: number): void;

  /**
   * Remove a specific order by id from the queue (used by cancel).
   * Returns `true` if the order was found and removed.
   */
  removeOrder(
    symbol: string,
    side: Side,
    price: number,
    orderId: string,
  ): boolean;

  /** Whether the queue at this price level is empty (or absent). */
  isPriceLevelEmpty(symbol: string, side: Side, price: number): boolean;

  /** Drop an empty price level so future best-price lookups skip it. */
  deletePriceLevel(symbol: string, side: Side, price: number): void;

  /** Aggregated snapshot for the given symbol. */
  getOrderBookSnapshot(symbol: string): OrderBookSnapshot;
}
