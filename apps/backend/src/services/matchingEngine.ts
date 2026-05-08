import { MatchingEngine, type Order, type MatchResult, type CancelResult } from '@repo/matching';
import type { OrderBookPort, RestingOrder, Side } from '@repo/matching';
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

  updateMarket(symbol: string, market: Market): void {
    this.engine.updateMarket(symbol, market);
  }
}

export const matchingEngineService = new MatchingEngineService();