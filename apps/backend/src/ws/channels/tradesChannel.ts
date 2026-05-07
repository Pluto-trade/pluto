import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';
import { TradeInfo } from '../../types';
import { getLatestTrade } from '../../lib/redis/trades';

const CHANNEL_NAME = 'trades';

// Poll Redis for latest trades.
const PUSH_INTERVAL_MS = 1000;

export class TradesChannel implements IWsChannel {
  readonly name = CHANNEL_NAME;

  private sm!: SubscriptionManager;
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private lastTradeTimestamp: Map<string, number> = new Map();

  init(sm: SubscriptionManager): void {
    this.sm = sm;
  }

  onSubscribe(client: WsClient, params: Record<string, string>): void {
    const { marketId } = params;
    if (!marketId) {
      client.socket.send(JSON.stringify({ error: 'trades channel requires marketId param' }));
      return;
    }
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    this.sm.subscribe(client.id, topic);

    if (!this.intervals.has(marketId)) {
      const handle = setInterval(() => {
        void this.push(marketId);
      }, PUSH_INTERVAL_MS);
      this.intervals.set(marketId, handle);
    }
  }

  onUnsubscribe(client: WsClient, params?: Record<string, string>): void {
    const marketId = params?.marketId;
    if (!marketId) return;
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    this.sm.unsubscribe(client.id, topic);

    if (this.sm.subscriberCount(topic) === 0) {
      clearInterval(this.intervals.get(marketId));
      this.intervals.delete(marketId);
      this.lastTradeTimestamp.delete(marketId);
    }
  }

  private async push(marketId: string): Promise<void> {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    if (this.sm.subscriberCount(topic) === 0) return;

    const trade = await getLatestTrade(marketId);
    if (!trade) return;
    const lastTimestamp = this.lastTradeTimestamp.get(marketId);
    if (lastTimestamp !== undefined && trade.timestamp <= lastTimestamp) return;

    this.lastTradeTimestamp.set(marketId, trade.timestamp);
    this.sm.broadcast<TradeInfo>(topic, {
      channel: CHANNEL_NAME,
      params: { marketId },
      data: trade,
      timestamp: Date.now(),
    });
  }
}

export const tradesChannel = new TradesChannel();
