import { expect, test } from "vitest";

import { MatchingEngine } from "./engine.ts";
import type { OrderBookPort } from "./orderBookPort.ts";
import type { Order, RestingOrder, Side } from "./types.ts";

const BASE_TIME = 1_700_000_000_000;

class InMemoryOrderBook implements OrderBookPort {
  private readonly booksBySymbol = new Map<
    string,
    {
      bids: Map<number, RestingOrder[]>;
      asks: Map<number, RestingOrder[]>;
    }
  >();

  addRestingOrder(order: RestingOrder): void {
    const symbolBook = this.getOrCreateSymbolBook(order.symbol);
    const sideBook = this.getSideBook(symbolBook, order.side);
    const restingQueue = sideBook.get(order.price) ?? [];

    if (!sideBook.has(order.price)) {
      sideBook.set(order.price, restingQueue);
    }

    restingQueue.push(order);
  }

  deletePriceLevel(symbol: string, side: Side, price: number): void {
    const symbolBook = this.booksBySymbol.get(symbol);
    if (!symbolBook) {
      return;
    }

    this.getSideBook(symbolBook, side).delete(price);
  }

  getBestPrice(symbol: string, side: Side): number | undefined {
    const symbolBook = this.booksBySymbol.get(symbol);
    if (!symbolBook) {
      return undefined;
    }

    const prices = Array.from(this.getSideBook(symbolBook, side).keys());
    if (prices.length === 0) {
      return undefined;
    }

    return side === "buy" ? Math.max(...prices) : Math.min(...prices);
  }

  getOrderBookSnapshot(symbol: string) {
    const symbolBook = this.booksBySymbol.get(symbol);

    if (!symbolBook) {
      return {
        symbol,
        bids: [],
        asks: [],
      };
    }

    return {
      symbol,
      bids: this.buildLevels(symbolBook.bids, "buy"),
      asks: this.buildLevels(symbolBook.asks, "sell"),
    };
  }

  getQueueAtPrice(
    symbol: string,
    side: Side,
    price: number,
  ): RestingOrder[] | undefined {
    const symbolBook = this.booksBySymbol.get(symbol);
    if (!symbolBook) {
      return undefined;
    }

    return this.getSideBook(symbolBook, side).get(price);
  }

  private getOrCreateSymbolBook(symbol: string) {
    const existingBook = this.booksBySymbol.get(symbol);

    if (existingBook) {
      return existingBook;
    }

    const newBook = {
      bids: new Map<number, RestingOrder[]>(),
      asks: new Map<number, RestingOrder[]>(),
    };

    this.booksBySymbol.set(symbol, newBook);
    return newBook;
  }

  private getSideBook(
    symbolBook: { bids: Map<number, RestingOrder[]>; asks: Map<number, RestingOrder[]> },
    side: Side,
  ): Map<number, RestingOrder[]> {
    return side === "buy" ? symbolBook.bids : symbolBook.asks;
  }

  private buildLevels(
    sideBook: Map<number, RestingOrder[]>,
    side: Side,
  ) {
    return Array.from(sideBook.entries())
      .sort(([priceA], [priceB]) =>
        side === "buy" ? priceB - priceA : priceA - priceB,
      )
      .map(([price, orders]) => ({
        price,
        totalQuantity: orders.reduce(
          (total, order) => total + order.remainingQuantity,
          0,
        ),
        orderCount: orders.length,
      }));
  }
}

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    userId: "user-1",
    symbol: "btc-usd",
    side: "buy",
    type: "limit",
    price: 100,
    quantity: 5,
    timestamp: BASE_TIME,
    ...overrides,
  };
}

test("normalizes symbol and stores resting order with sequence id", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());
  const result = engine.addOrder(buildOrder({ symbol: " btc-usd " }));

  expect(result.trades).toHaveLength(0);
  expect(result.orderStatus).toBe("resting");
  expect(result.remainingQuantity).toBe(5);
  expect(result.restingOrder?.symbol).toBe("BTC-USD");
  expect(result.restingOrder?.sequenceId).toBe(1);

  const snapshot = engine.getOrderBookSnapshot("btc-usd");
  expect(snapshot.symbol).toBe("BTC-USD");
  expect(snapshot.bids).toEqual([
    { price: 100, totalQuantity: 5, orderCount: 1 },
  ]);
});

test("rejects non-integer price and quantity during preprocessing", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());

  const invalidPriceResult = engine.addOrder(buildOrder({ price: 100.5 }));
  expect(invalidPriceResult.executionReports[0]?.status).toBe("rejected");
  expect(invalidPriceResult.orderStatus).toBe("rejected");
  expect(invalidPriceResult.remainingQuantity).toBe(0);
  expect(invalidPriceResult.executionReports[0]?.message ?? "").toMatch(
    /positive integer/,
  );

  const invalidQuantityResult = engine.addOrder(buildOrder({ id: "ord-2", quantity: 2.5 }));
  expect(invalidQuantityResult.executionReports[0]?.status).toBe("rejected");
});

test("uses FIFO within a price level", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());

  engine.addOrder(
    buildOrder({
      id: "maker-1",
      side: "sell",
      price: 101,
      quantity: 3,
      timestamp: BASE_TIME,
    }),
  );

  engine.addOrder(
    buildOrder({
      id: "maker-2",
      side: "sell",
      price: 101,
      quantity: 4,
      timestamp: BASE_TIME + 1,
    }),
  );

  const takerResult = engine.addOrder(
    buildOrder({
      id: "taker-1",
      price: 101,
      quantity: 5,
      timestamp: BASE_TIME + 2,
    }),
  );

  expect(takerResult.trades).toHaveLength(2);
  expect(takerResult.trades[0]?.sellOrderId).toBe("maker-1");
  expect(takerResult.trades[0]?.quantity).toBe(3);
  expect(takerResult.trades[0]?.makerOrderId).toBe("maker-1");
  expect(takerResult.trades[0]?.takerOrderId).toBe("taker-1");
  expect(takerResult.trades[1]?.sellOrderId).toBe("maker-2");
  expect(takerResult.trades[1]?.quantity).toBe(2);
  expect(takerResult.orderStatus).toBe("filled");
  expect(takerResult.remainingQuantity).toBe(0);

  const snapshot = engine.getOrderBookSnapshot("BTC-USD");
  expect(snapshot.asks).toEqual([
    { price: 101, totalQuantity: 2, orderCount: 1 },
  ]);
});

test("chooses best price across price levels before matching", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());

  engine.addOrder(
    buildOrder({
      id: "ask-102",
      side: "sell",
      price: 102,
      quantity: 2,
    }),
  );

  engine.addOrder(
    buildOrder({
      id: "ask-101",
      side: "sell",
      price: 101,
      quantity: 2,
      timestamp: BASE_TIME + 1,
    }),
  );

  const result = engine.addOrder(
    buildOrder({
      id: "buy-1",
      price: 102,
      quantity: 2,
      timestamp: BASE_TIME + 2,
    }),
  );

  expect(result.trades).toHaveLength(1);
  expect(result.trades[0]?.price).toBe(101);
  expect(result.trades[0]?.sellOrderId).toBe("ask-101");
});

test("keeps books isolated by normalized symbol", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());

  engine.addOrder(
    buildOrder({
      id: "eth-ask",
      symbol: "eth-usd",
      side: "sell",
      price: 200,
      quantity: 1,
    }),
  );

  const result = engine.addOrder(
    buildOrder({
      id: "btc-buy",
      symbol: "btc-usd",
      price: 250,
      quantity: 1,
      timestamp: BASE_TIME + 1,
    }),
  );

  expect(result.trades).toHaveLength(0);
  expect(result.orderStatus).toBe("resting");
  expect(result.remainingQuantity).toBe(1);
  expect(result.restingOrder?.symbol).toBe("BTC-USD");
  expect(engine.getOrderBookSnapshot("ETH-USD").asks).toEqual([
    { price: 200, totalQuantity: 1, orderCount: 1 },
  ]);
});

test("assigns increasing sequence ids to resting orders", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());

  const first = engine.addOrder(buildOrder({ id: "ord-1" }));
  const second = engine.addOrder(buildOrder({ id: "ord-2", price: 99, timestamp: BASE_TIME + 1 }));

  expect(first.restingOrder?.sequenceId).toBe(1);
  expect(second.restingOrder?.sequenceId).toBe(2);
});

test("returns partial-fill output with maker and taker ids", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());

  engine.addOrder(
    buildOrder({
      id: "maker-1",
      side: "sell",
      price: 101,
      quantity: 3,
    }),
  );

  const result = engine.addOrder(
    buildOrder({
      id: "taker-1",
      price: 101,
      quantity: 5,
      timestamp: BASE_TIME + 1,
    }),
  );

  expect(result.orderStatus).toBe("partially_filled");
  expect(result.remainingQuantity).toBe(2);
  expect(result.restingOrder?.id).toBe("taker-1");
  expect(result.restingOrder?.remainingQuantity).toBe(2);
  expect(result.trades[0]?.makerOrderId).toBe("maker-1");
  expect(result.trades[0]?.takerOrderId).toBe("taker-1");
});

test("cancels a resting order and removes it from the book", () => {
  const engine = new MatchingEngine(new InMemoryOrderBook());

  engine.addOrder(
    buildOrder({
      id: "resting-1",
      price: 99,
      quantity: 2,
    }),
  );

  const cancelResult = engine.cancelOrder("resting-1");

  expect(cancelResult.found).toBe(true);
  expect(cancelResult.executionReport.status).toBe("cancelled");
  expect(cancelResult.executionReport.remainingQuantity).toBe(2);
  expect(engine.getOrderBookSnapshot("BTC-USD").bids).toEqual([]);
});
