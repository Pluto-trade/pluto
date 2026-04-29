import { EventEmitter } from 'events';
import { IWsChannel, WsClient } from '../types';
import { SubscriptionManager } from '../SubscriptionManager';
import { TradeInfo } from '../../types';

const CHANNEL_NAME = 'trades';

// Event-driven channel — zero CPU cost when no trades are happening.
// Topic: "trades::marketId=BTC-USDC"
// To push a trade: tradeEventBus.emit('trade.matched', { marketId, trade })
export const tradeEventBus = new EventEmitter();

export class TradesChannel implements IWsChannel {
  readonly name = CHANNEL_NAME;

  private sm!: SubscriptionManager;

  init(sm: SubscriptionManager): void {
    this.sm = sm;
    tradeEventBus.on('trade.matched', (payload: { marketId: string; trade: TradeInfo }) => {
      this.push(payload.marketId, payload.trade);
    });
  }

  onSubscribe(client: WsClient, params: Record<string, string>): void {
    const { marketId } = params;
    if (!marketId) {
      client.socket.send(JSON.stringify({ error: 'trades channel requires marketId param' }));
      return;
    }
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    this.sm.subscribe(client.id, topic);
  }

  onUnsubscribe(client: WsClient, params?: Record<string, string>): void {
    const marketId = params?.marketId;
    if (!marketId) return;
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    this.sm.unsubscribe(client.id, topic);
  }

  private push(marketId: string, trade: TradeInfo): void {
    const topic = SubscriptionManager.makeTopic(CHANNEL_NAME, { marketId });
    if (this.sm.subscriberCount(topic) === 0) return;
    this.sm.broadcast<TradeInfo>(topic, {
      channel: CHANNEL_NAME,
      params: { marketId },
      data: trade,
      timestamp: Date.now(),
    });
  }
}

export const tradesChannel = new TradesChannel();
