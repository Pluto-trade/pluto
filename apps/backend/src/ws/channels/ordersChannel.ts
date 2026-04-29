import { EventEmitter } from 'events';
import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';

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

export const orderEventBus = new EventEmitter();

export interface OrderUpdatePayload {
  orderId: string;
  status: string;
  remainingSize?: number;
  filledSize?: number;
  marketId: string;
  side: string;
  price?: number;
  size: number;
  updatedAt: number;
}

export class OrdersChannel implements IWsChannel {
  readonly name = CHANNEL_NAME;

  private sm!: SubscriptionManager;

  init(sm: SubscriptionManager): void {
    this.sm = sm;
    orderEventBus.on('order.updated', (payload: { userId: string; order: OrderUpdatePayload }) => {
      this.push(payload.userId, payload.order);
    });
  }

  onSubscribe(client: WsClient, params: Record<string, string>): void {
    const { userId } = params;
    if (!userId) {
      client.socket.send(JSON.stringify({ error: 'orders channel requires userId param' }));
      return;
    }
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { userId });
    this.sm.subscribe(client.id, topic);
  }

  onUnsubscribe(client: WsClient, params?: Record<string, string>): void {
    const userId = params?.userId;
    if (!userId) return;
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { userId });
    this.sm.unsubscribe(client.id, topic);
  }

  //  Private 

  private push(userId: string, order: OrderUpdatePayload): void {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { userId });
    if (this.sm.subscriberCount(topic) === 0) return;
    this.sm.broadcast<OrderUpdatePayload>(topic, {
      channel: CHANNEL_NAME,
      params: { userId },
      data: order,
      timestamp: Date.now(),
    });
  }
}

export const ordersChannel = new OrdersChannel();
