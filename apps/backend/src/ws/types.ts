import { WebSocket } from 'ws';


/**
 * A connected WebSocket client with an associated ID.
 * We tag every socket so we can look it up in SubscriptionManager.
 */
export interface WsClient {
  id: string;
  socket: WebSocket;
}

export type WsAction = 'subscribe' | 'unsubscribe' | 'ping';

/**
 * Examples:
 *   { "action": "subscribe",   "channel": "orderbook", "marketId": "BTC-USDC" }
 *   { "action": "unsubscribe", "channel": "trades",    "marketId": "BTC-USDC" }
 *   { "action": "subscribe",   "channel": "orders",    "userId": "user_123"   }
 */
export interface InboundMessage {
  action: WsAction;
  channel: string;
  params?: Record<string, string>; // marketId, userId, etc.
}

//  Outbound Messages (server → client) 

/**
 * Every push the server sends follows this envelope.
 *
 * Examples:
 *   { "channel": "orderbook", "marketId": "BTC-USDC", "data": { bids, asks } }
 *   { "channel": "trades",    "marketId": "BTC-USDC", "data": { price, size } }
 */
export interface OutboundMessage<T = unknown> {
  channel: string;
  params?: Record<string, string>;
  data: T;
  timestamp: number;
}

// Every channel module must implement this. Adding a channel = new file satisfying this interface.
export interface IWsChannel {
  readonly name: string;

  // Called once at startup — start intervals/listeners here.
  init(subscriptionManager: import('./SubscriptionManager').SubscriptionManager): void;

  // Called when a client subscribes / unsubscribes (or disconnects).
  onSubscribe(client: WsClient, params: Record<string, string>): void;

  /** Called when a client sends { action: "unsubscribe" } or disconnects */
  onUnsubscribe(client: WsClient, params?: Record<string, string>): void;
}
