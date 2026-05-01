import { OrderBook, OrderType, Side } from 'nodejs-order-book';
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from 'uuid';
import { TradeInfo, OrderbookSnapshot } from '../types';

export class OrderbookService {
  private orderbooks: Map<string, OrderBook> = new Map();
  private trades: Map<string, TradeInfo[]> = new Map();
  private lastPrices: Map<string, number> = new Map();

  getOrCreateOrderbook(marketId: string): OrderBook {
    if (!this.orderbooks.has(marketId)) {
      this.orderbooks.set(marketId, new OrderBook({ enableJournaling: true }));
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

    if (type === 'limit' && price !== undefined) {
      return ob.limit({
        id: orderId,
        side: side as Side,
        size,
        price,
      });
    } else if (type === 'market') {
      return ob.market({
        side: side as Side,
        size,
      });
    }

    throw new Error('Invalid order type or missing price for limit order');
  }

  cancelOrder(marketId: string, orderId: string) {
    const ob = this.getOrCreateOrderbook(marketId);
    return ob.cancel(orderId);
  }

  modifyOrder(marketId: string, orderId: string, size: number, price: number) {
    const ob = this.getOrCreateOrderbook(marketId);
    return ob.modify(orderId, { size, price });
  }

  getOrderbookSnapshot(marketId: string): OrderbookSnapshot {
    const ob = this.getOrCreateOrderbook(marketId);
    const snapshot = ob.snapshot();

    const bids = snapshot.bids.map((level: any) => ({
      price: level.price,
      size: level.orders.reduce((sum: number, order: any) => sum + order.size, 0),
    }));

    const asks = snapshot.asks.map((level: any) => ({
      price: level.price,
      size: level.orders.reduce((sum: number, order: any) => sum + order.size, 0),
    }));

    return {
      bids,
      asks,
      timestamp: Date.now(),
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
