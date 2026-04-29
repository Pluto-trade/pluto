import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';
import { orderbookService } from '../../services/orderbook';
import { OrderbookSnapshot } from '../../types';

const CHANNEL_NAME = 'orderbook';
const PUSH_INTERVAL_MS = 100; // 100ms snapshot push

// Polls orderbookService at a fixed interval and broadcasts to subscribers.
// Interval is started on first subscribe and stopped when last subscriber leaves.
// Topic: "orderbook::marketId=BTC-USDC"
export class OrderbookChannel implements IWsChannel {
  readonly name = CHANNEL_NAME;

  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map(); // marketId → timer
  private sm!: SubscriptionManager;

  init(sm: SubscriptionManager): void {
    this.sm = sm;
  }

  onSubscribe(client: WsClient, params: Record<string, string>): void {
    const { marketId } = params;
    if (!marketId) {
      client.socket.send(JSON.stringify({ error: 'orderbook channel requires marketId param' }));
      return;
    }

    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    this.sm.subscribe(client.id, topic);

    if (!this.intervals.has(marketId)) {
      const handle = setInterval(() => this.push(marketId), PUSH_INTERVAL_MS);
      this.intervals.set(marketId, handle);
    }
  }

  onUnsubscribe(client: WsClient, params?: Record<string, string>): void {
    const marketId = params?.marketId;
    if (!marketId) return;

    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    this.sm.unsubscribe(client.id, topic);

    // Stop the interval when nobody is watching this market anymore
    if (this.sm.subscriberCount(topic) === 0) {
      clearInterval(this.intervals.get(marketId));
      this.intervals.delete(marketId);
    }
  }

  //  Private 

  private push(marketId: string): void {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });

    // Skip expensive work if nobody is listening
    if (this.sm.subscriberCount(topic) === 0) return;

    const snapshot: OrderbookSnapshot = orderbookService.getOrderbookSnapshot(marketId);
    this.sm.broadcast<OrderbookSnapshot>(topic, {
      channel: CHANNEL_NAME,
      params: { marketId },
      data: snapshot,
      timestamp: Date.now(),
    });
  }
}

export const orderbookChannel = new OrderbookChannel();
