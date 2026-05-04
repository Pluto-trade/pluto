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
import { marketService } from './market';

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
    if (shadow) shadow.remainingQuantity = newRemaining;
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

  constructor() {
    this.adapter = new OrderBookAdapter();
    this.engine = new MatchingEngine(this.adapter);
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
    const quantity = Math.floor(request.size);
    const timestamp = Date.now();
    const base = { id: request.orderId, userId: request.userId, symbol: market.symbol, side, quantity, timestamp };

    const matchingOrder: Order =
      request.type.toLowerCase() === 'limit' && request.price !== undefined
        ? { ...base, type: 'limit', price: Math.floor(request.price) }
        : { ...base, type: 'market' };

    return this.engine.addOrder(matchingOrder);
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
}

export const matchingEngineService = new MatchingEngineService();
