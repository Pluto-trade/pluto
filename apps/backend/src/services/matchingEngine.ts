import {
  OrderBook,
  OrderSide,
  OrderStatus,
  OrderType,
  type ILimitOrder,
} from '@repo/orderbook';
import {
  MatchingEngine,
  type CancelResult,
  type MatchResult,
  type Order,
  type OrderBookPort,
  type OrderBookSnapshot,
  type RestingOrder,
  type Side,
} from '@repo/matching';
import type { Market } from '@repo/mpe';
import { marketService } from './market';
import { getOrderbook } from '../lib/redis/orderbook';

class OrderBookAdapter implements OrderBookPort {
  // symbol → OrderBook   (the actual order storage from @repo/orderbook)
  private readonly books = new Map<string, OrderBook>();
  // orderId → RestingOrder   (the engine-only metadata which @repo/orderbook does not store)
  private readonly restingOrders = new Map<string, RestingOrder>();

  addRestingOrder(order: RestingOrder): void {
    const sideEnum = toOrderSide(order.side);
    const limitOrder: ILimitOrder = {
      id: order.id,
      userId: order.userId,
      marketId: order.symbol,
      side: sideEnum,
      type: OrderType.LIMIT,
      price: order.price,
      size: order.quantity,
      remainingSize: order.remainingQuantity,
      status: OrderStatus.OPEN,
      createdAt: order.timestamp,
      updatedAt: order.timestamp,
    };
    this.getOrCreateBook(order.symbol).getSide(sideEnum).append(limitOrder);
    this.restingOrders.set(order.id, { ...order });
  }

  getBestPrice(symbol: string, side: Side): number | undefined {
    const book = this.books.get(symbol);
    if (!book) return undefined;
    return side === 'buy' ? book.bestBid() : book.bestAsk();
  }

  peekHead(
    symbol: string,
    side: Side,
    price: number,
  ): RestingOrder | undefined {
    const head = this.getQueue(symbol, side, price)?.head();
    if (!head) return undefined;
    const shadow = this.restingOrders.get(head.id);
    if (!shadow) return undefined;
    shadow.remainingQuantity = head.remainingSize;
    return shadow;
  }

  applyFillToHead(
    symbol: string,
    side: Side,
    price: number,
    fillQty: number,
  ): void {
    const book = this.books.get(symbol);
    if (!book) return;
    const sideRef = book.getSide(toOrderSide(side));
    const head = sideRef.getQueue(price)?.head();
    if (!head) return;
    const newRemaining = head.remainingSize - fillQty;
    sideRef.update({
      ...head,
      remainingSize: newRemaining,
      updatedAt: Date.now(),
    });
    const shadow = this.restingOrders.get(head.id);
    if (shadow) {
      shadow.remainingQuantity = newRemaining;
      shadow.timestamp = Date.now();
    }
  }

  removeHead(symbol: string, side: Side, price: number): void {
    const book = this.books.get(symbol);
    if (!book) return;
    const sideRef = book.getSide(toOrderSide(side));
    const head = sideRef.getQueue(price)?.head();
    if (!head) return;
    sideRef.remove(head.id);
    this.restingOrders.delete(head.id);
  }

  removeOrder(
    symbol: string,
    side: Side,
    _price: number,
    orderId: string,
  ): boolean {
    const book = this.books.get(symbol);
    if (!book) return false;
    const removed = book.getSide(toOrderSide(side)).remove(orderId);
    if (!removed) return false;
    this.restingOrders.delete(orderId);
    return true;
  }

  isPriceLevelEmpty(symbol: string, side: Side, price: number): boolean {
    const queue = this.getQueue(symbol, side, price);
    return !queue || queue.isEmpty;
  }

  // BookSide auto-prunes empty queues on remove(); keep this as a noop so
  // the matching loop's explicit cleanup call is harmless.
  deletePriceLevel(_symbol: string, _side: Side, _price: number): void {}

  getOrderBookSnapshot(symbol: string): OrderBookSnapshot {
    const book = this.books.get(symbol);
    if (!book) return { symbol, bids: [], asks: [] };
    const { bids, asks } = book.depth();
    return {
      symbol,
      bids: bids.map((level) => ({
        price: level.price,
        totalQuantity: level.volume,
        orderCount: level.orders,
      })),
      asks: asks.map((level) => ({
        price: level.price,
        totalQuantity: level.volume,
        orderCount: level.orders,
      })),
    };
  }

  private getOrCreateBook(symbol: string): OrderBook {
    let book = this.books.get(symbol);
    if (!book) {
      book = new OrderBook(symbol);
      this.books.set(symbol, book);
    }
    return book;
  }

  private getQueue(symbol: string, side: Side, price: number) {
    const book = this.books.get(symbol);
    if (!book) return undefined;
    return book.getSide(toOrderSide(side)).getQueue(price);
  }
}

function toOrderSide(side: Side): OrderSide {
  return side === 'buy' ? OrderSide.BUY : OrderSide.SELL;
}


/**
 * Service that manages the matching engine and its interactions with the orderbook.
 */
export class MatchingEngineService {
  private readonly engine: MatchingEngine;
  private readonly adapter: OrderBookAdapter;
  private hydrated = false;

  constructor() {
    this.adapter = new OrderBookAdapter();
    this.engine = new MatchingEngine(this.adapter);
    this.hydrateFromRedis().catch((error) => {
      console.error("Failed to hydrate matching engine from Redis", error);
    });
  }

  private async hydrateFromRedis(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;
    const markets = await marketService.listMarkets();

    for (const market of markets) {
      const snapshot = await getOrderbook(market.id);
      const orders: Array<Omit<RestingOrder, "sequenceId">> = [];

      for (const level of snapshot.bids) {
        const price = Number(level.price);
        for (const order of level.orders) {
          orders.push({
            id: order.id,
            userId: order.userId || "unknown",
            symbol: market.symbol,
            side: "buy",
            type: "limit",
            price,
            quantity: Number(order.size),
            remainingQuantity: Number(order.size),
            timestamp: Number(order.timestamp),
          });
        }
      }

      for (const level of snapshot.asks) {
        const price = Number(level.price);
        for (const order of level.orders) {
          orders.push({
            id: order.id,
            userId: order.userId || "unknown",
            symbol: market.symbol,
            side: "sell",
            type: "limit",
            price,
            quantity: Number(order.size),
            remainingQuantity: Number(order.size),
            timestamp: Number(order.timestamp),
          });
        }
      }

      if (orders.length > 0) {
        this.engine.loadRestingOrders(orders);
      }
    }
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

    const side = request.side.toLowerCase() as 'buy' | 'sell';
    const quantity = request.size;
    const timestamp = Date.now();
    const base = { id: request.orderId, userId: request.userId, symbol: market.symbol, side, quantity, timestamp };
    
    const matchingOrder: Order =
    request.type.toLowerCase() === 'limit' && request.price !== undefined
    ? { ...base, type: 'limit', price: request.price }
    : { ...base, type: 'market' };
    // console.log(`Adding order: ${request.orderId}, ${side} ${quantity} of ${market.symbol} at price ${request.price ?? 'market'}`);

    return this.engine.addOrder(matchingOrder);
  }

  async peekBestMatch(request: {
    marketId: string;
    side: string;
    type: string;
    price?: number;
  }): Promise<RestingOrder | undefined> {
    const market = await marketService.getMarket(request.marketId);

    if (!market) {
      throw new Error(`Market not found: ${request.marketId}`);
    }

    const incomingSide = request.side.toLowerCase() as "buy" | "sell";
    const oppositeSide = incomingSide === "buy" ? "sell" : "buy";
    const bestOppositePrice = this.adapter.getBestPrice(market.symbol, oppositeSide);

    if (bestOppositePrice === undefined) return undefined;
    if (
      request.type.toLowerCase() === "limit" &&
      request.price !== undefined &&
      (incomingSide === "buy"
        ? request.price < bestOppositePrice
        : request.price > bestOppositePrice)
    ) {
      return undefined;
    }

    return this.adapter.peekHead(market.symbol, oppositeSide, bestOppositePrice);
  }

  cancelOrder(orderId: string): CancelResult {
    return this.engine.cancelOrder(orderId);
  }

  async getSnapshot(marketId: string) {
    const market = await marketService.getMarket(marketId);

    if (!market) {
      throw new Error(`Market not found: ${marketId}`);
    }

    return this.engine.getOrderBookSnapshot(market.symbol);
  }

  updateMarket(symbol: string, market: Market): void {
    this.engine.updateMarket(symbol, market);
  }
}

export const matchingEngineService = new MatchingEngineService();
