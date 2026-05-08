import { MatchingEngine, type Order, type MatchResult, type CancelResult } from '@repo/matching';
import type { OrderBookPort, RestingOrder, Side } from '@repo/matching';
import type { Market } from '@repo/mpe';
import { marketService } from './market';

class MatchingOrderBook implements OrderBookPort {
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

    return side === 'buy' ? Math.max(...prices) : Math.min(...prices);
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
      bids: this.buildLevels(symbolBook.bids, 'buy'),
      asks: this.buildLevels(symbolBook.asks, 'sell'),
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

  peekHead(symbol: string, side: Side, price: number): RestingOrder | undefined {
    return this.getQueueAtPrice(symbol, side, price)?.[0];
  }

  applyFillToHead(symbol: string, side: Side, price: number, fillQty: number): void {
    const head = this.getQueueAtPrice(symbol, side, price)?.[0];
    if (head) {
      head.remainingQuantity -= fillQty;
    }
  }

  removeHead(symbol: string, side: Side, price: number): void {
    this.getQueueAtPrice(symbol, side, price)?.shift();
  }

  removeOrder(symbol: string, side: Side, price: number, orderId: string): boolean {
    const queue = this.getQueueAtPrice(symbol, side, price);
    if (!queue) return false;
    const idx = queue.findIndex((o) => o.id === orderId);
    if (idx === -1) return false;
    queue.splice(idx, 1);
    return true;
  }

  isPriceLevelEmpty(symbol: string, side: Side, price: number): boolean {
    const queue = this.getQueueAtPrice(symbol, side, price);
    return !queue || queue.length === 0;
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
    return side === 'buy' ? symbolBook.bids : symbolBook.asks;
  }

  private buildLevels(
    sideBook: Map<number, RestingOrder[]>,
    side: Side,
  ) {
    return Array.from(sideBook.entries())
      .sort(([priceA], [priceB]) =>
        side === 'buy' ? priceB - priceA : priceA - priceB,
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

export class MatchingEngineService {
  private engine: MatchingEngine;
  private book: MatchingOrderBook;

  constructor() {
    this.book = new MatchingOrderBook();
    this.engine = new MatchingEngine(this.book);
  }

  async addOrder(request: {
    orderId: string;
    userId: string;
    marketId: string;
    side: string;
    type: string;
    size: number;
    price?: number;
  }): Promise<MatchResult> {
    const market = await marketService.getMarket(request.marketId);

    if (!market) {
      throw new Error(`Market not found: ${request.marketId}`);
    }

    const matchingOrder: Order = {
      id: request.orderId,
      userId: request.userId,
      symbol: market.symbol,
      side: request.side.toLowerCase() as 'buy' | 'sell',
      type: request.type.toLowerCase() as 'limit' | 'market',
      quantity: Math.floor(request.size),
      price: request.price ? Math.floor(request.price) : undefined,
      timestamp: Date.now(),
    };

    return this.engine.addOrder(matchingOrder);
  }

  cancelOrder(orderId: string): CancelResult {
    return this.engine.cancelOrder(orderId);
  }

  updateMarket(symbol: string, market: Market): void {
    this.engine.updateMarket(symbol, market);
  }

  async getSnapshot(marketId: string) {
    const market = await marketService.getMarket(marketId);

    if (!market) {
      throw new Error(`Market not found: ${marketId}`);
    }

    return this.engine.getOrderBookSnapshot(market.symbol);
  }
}

export const matchingEngineService = new MatchingEngineService();
