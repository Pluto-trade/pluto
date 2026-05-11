import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';
import { OrderbookSnapshot } from '../../types';
import { getOrderbook } from '../../lib/redis/orderbook';


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

  //  Private : added redis calling for order snapshot
  private async push(marketId: string): Promise<void> {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });

    // Skip expensive work if nobody is listening
    if (this.sm.subscriberCount(topic) === 0) return;

    try {
      // Fetch Redis orderbook with per-order timestamps
      const redisSnapshot = await getOrderbook(marketId);
      // console.log(redisSnapshot);
      
      const liveAsks = redisSnapshot.asks.map((ask) => {
        return {
          price: Number(ask.price),
          size: Number(ask.size),
          orders: ask.orders.map((order) => ({
            id: order.id,
            size: Number(order.size),
            createdAt: Number(order.timestamp),
          })),
          timestamp: ask.orders.length > 0 ? Number(ask.orders[0].timestamp) : redisSnapshot.timestamp,
        }
      });
      
      const liveBids = redisSnapshot.bids.map((bid) => {
        return {
          price: Number(bid.price),
          size: Number(bid.size),
          orders: bid.orders.map((order) => ({
            id: order.id,
            size: Number(order.size),
            createdAt: Number(order.timestamp),
          })),
          timestamp: bid.orders.length > 0 ? Number(bid.orders[0].timestamp) : redisSnapshot.timestamp,
        }
      });

      const snapshot: OrderbookSnapshot = {
        asks: liveAsks,
        bids: liveBids,
        timestamp: redisSnapshot.timestamp,
      };

      this.sm.broadcast<OrderbookSnapshot>(topic, {
        channel: CHANNEL_NAME,
        params: { marketId },
        data: snapshot,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("[WS][orderbook] failed to push snapshot", { marketId, error });
    }
  }
}

export const orderbookChannel = new OrderbookChannel();
