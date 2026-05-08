import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';
import { getOrderbook } from '../../lib/redis/orderbook';
import { getLatestTrade, getStats24h } from '../../lib/redis/trades';
import { TickerInfo } from '../../types';

const CHANNEL_NAME = 'ticker';
const PUSH_INTERVAL_MS = 1000; // ticker is less urgent — push every second

/**
 * TickerChannel
 *
 * Pushes aggregated market ticker data (best bid/ask, last price, 24h volume)
 * to subscribers on a 1-second interval. Derived purely from orderbookService
 * — no additional data source needed.
 *
 * Topic key: "ticker::marketId=BTC-USDC"
 */
export class TickerChannel implements IWsChannel {
  readonly name = CHANNEL_NAME;

  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private sm!: SubscriptionManager;

  init(sm: SubscriptionManager): void {
    this.sm = sm;
  }

  onSubscribe(client: WsClient, params: Record<string, string>): void {
    const { marketId } = params;
    if (!marketId) {
      client.socket.send(JSON.stringify({ error: 'ticker channel requires marketId param' }));
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
    }
  }

  //  Private 

  private async push(marketId: string): Promise<void> {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    if (this.sm.subscriberCount(topic) === 0) return;

    const snapshot = await getOrderbook(marketId);
    const bestBid = snapshot.bids[0]?.price ? Number(snapshot.bids[0].price) : null;
    const bestAsk = snapshot.asks[0]?.price ? Number(snapshot.asks[0].price) : null;
    const latestTrade = await getLatestTrade(marketId);
    const lastPrice = latestTrade ? latestTrade.price : null;
    const stats24h = await getStats24h(marketId);

    const ticker: TickerInfo = {
      bestBid,
      bestAsk,
      lastPrice,
      volume24h: stats24h.volume,
      high24h: stats24h.high,
      low24h: stats24h.low,
      change24h: stats24h.change24h,
      timestamp: Date.now(),
    };

    this.sm.broadcast<TickerInfo>(topic, {
      channel: CHANNEL_NAME,
      params: { marketId },
      data: ticker,
      timestamp: Date.now(),
    });
  }
}

export const tickerChannel = new TickerChannel();
