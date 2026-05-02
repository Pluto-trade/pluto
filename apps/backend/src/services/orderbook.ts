import { createMarketOrder, OrderBook, OrderSide, OrderType } from '@repo/orderbook';
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from 'uuid';
import { TradeInfo, OrderbookSnapshot } from '../types';
import { timeStamp } from 'node:console';

export class OrderbookService {
  private orderbooks: Map<string, OrderBook> = new Map();
  private trades: Map<string, TradeInfo[]> = new Map();
  private lastPrices: Map<string, number> = new Map();

  getOrCreateOrderbook(marketId: string): OrderBook {
    if (!this.orderbooks.has(marketId)) {
      this.orderbooks.set(marketId, new OrderBook(marketId));
      this.trades.set(marketId, []);
    }
    return this.orderbooks.get(marketId)!;
  }

  placeOrder(
    marketId: string,
    orderId: string,
    side: 'buy' | 'sell',
    type: 'limit' | 'market',
    size: number,
    price?: number
  ) {
    const ob = this.getOrCreateOrderbook(marketId);
    const userId = 'system'; // placeholder user for orderbook orders

    if (type === 'limit' && price !== undefined) {
      return ob.addLimit({
        id: orderId,
        userId,
        marketId,
        side: side.toUpperCase() === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
        price,
        size,
      });
    } else if (type === 'market') {
      const marketOrderOptions = {
        id: orderId,
        userId: userId,
        marketId: marketId,
        side: side.toUpperCase() === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
        size: size
      }
      return createMarketOrder(marketOrderOptions)
    }

    throw new Error('Invalid order type or missing price for limit order');
  }

  cancelOrder(marketId: string, orderId: string) {
    const ob = this.getOrCreateOrderbook(marketId);
    return ob.cancel(orderId);
  }

  getOrderbookSnapshot(marketId: string): OrderbookSnapshot {
    const ob = this.getOrCreateOrderbook(marketId);
    const snapshot = ob.snapshot();

    const bids = snapshot.bids.map((level) => {
      const size = level.orders.reduce((sum: number, order: any) => sum + order.size, 0);
      const orders = level.orders.map((order: any) => ({
        id: order.id,
        size: order.size,
        createdAt: order.createdAt ?? null,
      }));
      return {
        price: level.price,
        size,
        orders,
        timestamp: level.orders.length > 0 ? (level.orders[0].createdAt ?? snapshot.ts) : snapshot.ts,
      };
    });

    const asks = snapshot.asks.map((level) => {
      const size = level.orders.reduce((sum: number, order: any) => sum + order.size, 0);
      const orders = level.orders.map((order: any) => ({
        id: order.id,
        size: order.size,
        createdAt: order.createdAt ?? null,
      }));
      return {
        price: level.price,
        size,
        orders,
        timestamp: level.orders.length > 0 ? (level.orders[0].createdAt ?? snapshot.ts) : snapshot.ts,
      };
    });

    return {
      bids,
      asks,
      timestamp: snapshot.ts || Date.now(),
    };
  }

  recordTrade(
    marketId: string,
    price: number,
    size: number,
    buyOrderId: string,
    sellOrderId: string
  ) {
    const trade: TradeInfo = {
      price,
      size,
      buyOrderId,
      sellOrderId,
      timestamp: Date.now(),
    };

    const trades = this.trades.get(marketId) || [];
    trades.push(trade);
    this.trades.set(marketId, trades);
    this.lastPrices.set(marketId, price);

    return trade;
  }

  getRecentTrades(marketId: string, limit: number = 100): TradeInfo[] {
    const trades = this.trades.get(marketId) || [];
    return trades.slice(-limit);
  }

  getLastPrice(marketId: string): number | null {
    return this.lastPrices.get(marketId) || null;
  }

  getVolume24h(marketId: string): number {
    const trades = this.trades.get(marketId) || [];
    return trades.reduce((sum, trade) => sum + trade.size, 0);
  }
}

export const orderbookService = new OrderbookService();
