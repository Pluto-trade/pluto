import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';
import { getLatestOrderEvent, type OrderEventPayload } from '../../lib/redis/orderEvents';

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

export class OrdersChannel implements IWsChannel {
  readonly name = CHANNEL_NAME;

  private sm!: SubscriptionManager;
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private lastUpdateTime: Map<string, number> = new Map();

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
    }
  }

  //  Private
  private async push(userId: string): Promise<void> {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { userId });
    if (this.sm.subscriberCount(topic) === 0) return;

    const order = await getLatestOrderEvent(userId);
    if (!order) return;
    const lastSent = this.lastUpdateTime.get(userId);
    if (lastSent !== undefined && order.updatedAt <= lastSent) return;

    this.lastUpdateTime.set(userId, order.updatedAt);
    this.sm.broadcast<OrderEventPayload>(topic, {
      channel: CHANNEL_NAME,
      params: { userId },
      data: order,
      timestamp: Date.now(),
    });
  }
}

export const ordersChannel = new OrdersChannel();
