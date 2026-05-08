import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';
import { getLatestOrderEvent, type OrderEventPayload } from '../../lib/redis/orderEvents';
import { getOrderbook } from '../../lib/redis/orderbook';
import { marketService } from '../../services/market';
import { FEED_IDS, getCachedPrice } from '@repo/oracle';

const CHANNEL_NAME = 'orders';

/**
 * OrdersChannel — User-scoped, event-driven
 *
 * Unlike orderbook/ticker (market-scoped), this channel is scoped to
 * a userId. A client subscribes with { channel: "orders", userId: "user_123" }
 * and receives real-time status updates whenever one of their orders changes.
 *
 * Topic key: "orders::userId=user_123"
 *
 * HOW TO EMIT FROM ORDER/TRADE SERVICE:
 *   import { orderEventBus } from '../ws/channels/ordersChannel';
 *   orderEventBus.emit('order.updated', { userId, order });
 */

const PUSH_INTERVAL_MS = 1000;

type ActiveOrderSnapshot = {
  orderId: string;
  marketId: string;
  marketSymbol: string | null;
  marketDisplay: string | null;
  side: string;
  size: number;
  entryPrice: number | null;
  markPrice: number | null;
  pnl: number | null;
};

type OrdersChannelPayload = {
  latestEvent: OrderEventPayload | null;
  activeOrders: ActiveOrderSnapshot[];
};

export class OrdersChannel implements IWsChannel {
  readonly name = CHANNEL_NAME;

  private sm!: SubscriptionManager;
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private lastUpdateTime: Map<string, number> = new Map();
  private lastActiveSignature: Map<string, string> = new Map();

  init(sm: SubscriptionManager): void {
    this.sm = sm;
  }

  onSubscribe(client: WsClient, params: Record<string, string>): void {
    const { userId } = params;
    if (!userId) {
      client.socket.send(JSON.stringify({ error: 'orders channel requires userId param' }));
      return;
    }
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { userId });
    this.sm.subscribe(client.id, topic);

    if (!this.intervals.has(userId)) {
      const handle = setInterval(() => {
        void this.push(userId);
      }, PUSH_INTERVAL_MS);
      this.intervals.set(userId, handle);
    }
  }

  onUnsubscribe(client: WsClient, params?: Record<string, string>): void {
    const userId = params?.userId;
    if (!userId) return;
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { userId });
    this.sm.unsubscribe(client.id, topic);

    if (this.sm.subscriberCount(topic) === 0) {
      clearInterval(this.intervals.get(userId));
      this.intervals.delete(userId);
      this.lastUpdateTime.delete(userId);
      this.lastActiveSignature.delete(userId);
    }
  }

  //  Private
  private async push(userId: string): Promise<void> {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { userId });
    if (this.sm.subscriberCount(topic) === 0) return;

    const order = await getLatestOrderEvent(userId);
    const activeOrders = await this.buildActiveOrdersSnapshot(userId);
    const activeSignature = this.signatureFor(activeOrders);

    const lastSent = this.lastUpdateTime.get(userId);
    const lastSignature = this.lastActiveSignature.get(userId);
    const orderIsNew = order && (lastSent === undefined || order.updatedAt > lastSent);
    const activeChanged = activeSignature !== lastSignature;

    if (!orderIsNew && !activeChanged) return;

    if (order) this.lastUpdateTime.set(userId, order.updatedAt);
    this.lastActiveSignature.set(userId, activeSignature);

    this.sm.broadcast<OrdersChannelPayload>(topic, {
      channel: CHANNEL_NAME,
      params: { userId },
      data: {
        latestEvent: order ?? null,
        activeOrders,
      },
      timestamp: Date.now(),
    });
  }

  private async buildActiveOrdersSnapshot(userId: string): Promise<ActiveOrderSnapshot[]> {
    const markets = await marketService.listMarkets();
    if (markets.length === 0) return [];

    const activeOrders: ActiveOrderSnapshot[] = [];

    for (const market of markets) {
      const snapshot = await getOrderbook(market.id);
      const marketSymbol = market.symbol ?? null;
      const marketDisplay = marketSymbol ? marketSymbol.replace("-", "/") : null;
      const markPrice = this.resolveMarkPrice(marketSymbol, null);

      const allLevels = [
        ...snapshot.bids.map((level) => ({
          side: "BUY" as const,
          price: level.price,
          orders: level.orders,
        })),
        ...snapshot.asks.map((level) => ({
          side: "SELL" as const,
          price: level.price,
          orders: level.orders,
        })),
      ];

      for (const level of allLevels) {
        for (const order of level.orders) {
          if (!order.userId || order.userId !== userId) continue;
          const size = Number(order.size ?? "0");
          if (!Number.isFinite(size) || size <= 0) continue;

          const entryPrice = Number(level.price ?? 0);
          const pnl = this.calculatePnl(level.side, size, entryPrice, markPrice);

          activeOrders.push({
            orderId: order.id,
            marketId: market.id,
            marketSymbol,
            marketDisplay,
            side: level.side,
            size,
            entryPrice: Number.isFinite(entryPrice) ? entryPrice : null,
            markPrice,
            pnl,
          });
        }
      }
    }

    return activeOrders;
  }

  private resolveMarkPrice(marketSymbol: string | null, fallbackPrice: number | null): number | null {
    if (!marketSymbol) return fallbackPrice;
    const oracleSymbol = this.resolveOracleSymbol(marketSymbol);
    if (!oracleSymbol) return fallbackPrice;
    const cached = getCachedPrice(oracleSymbol);
    return cached?.price ?? fallbackPrice;
  }

  private resolveOracleSymbol(marketSymbol: string): string | null {
    if (FEED_IDS[marketSymbol]) return marketSymbol;
    if (marketSymbol.endsWith("-USDC")) {
      const candidate = marketSymbol.replace("-USDC", "-USD");
      return FEED_IDS[candidate] ? candidate : null;
    }
    if (marketSymbol.endsWith("-USDT")) {
      const candidate = marketSymbol.replace("-USDT", "-USD");
      return FEED_IDS[candidate] ? candidate : null;
    }
    return null;
  }

  private calculatePnl(
    side: string,
    size: number,
    entryPrice: number | null,
    markPrice: number | null,
  ): number | null {
    if (!Number.isFinite(size) || size <= 0) return null;
    if (entryPrice === null || markPrice === null) return null;

    const normalizedSide = side.toUpperCase();
    if (normalizedSide === "BUY") return (markPrice - entryPrice) * size;
    if (normalizedSide === "SELL") return (entryPrice - markPrice) * size;
    return null;
  }

  private signatureFor(activeOrders: ActiveOrderSnapshot[]): string {
    return activeOrders
      .slice()
      .sort((a, b) => a.orderId.localeCompare(b.orderId))
      .map((order) => [
        order.orderId,
        order.marketId,
        order.side,
        order.size.toString(),
        order.entryPrice?.toString() ?? "",
        order.markPrice?.toString() ?? "",
      ].join("|"))
      .join(";");
  }
}

export const ordersChannel = new OrdersChannel();
