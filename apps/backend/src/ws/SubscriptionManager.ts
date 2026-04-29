import { WsClient, OutboundMessage } from './types';

// Routing table: maps topics → subscribed clients and vice-versa.
// Topic format: "orderbook::marketId=BTC-USDC", "orders::userId=user_123"
export class SubscriptionManager {
  private topicClients: Map<string, Set<string>> = new Map(); // topic → clientIds
  private clientTopics: Map<string, Set<string>> = new Map(); // clientId → topics
  private clients: Map<string, WsClient> = new Map();         // clientId → WsClient

  registerClient(client: WsClient): void {
    this.clients.set(client.id, client);
    this.clientTopics.set(client.id, new Set());
  }

  /** Remove a client and clean up all its subscriptions. */
  removeClient(clientId: string): void {
    const topics = this.clientTopics.get(clientId) ?? new Set();
    for (const topic of topics) {
      this.topicClients.get(topic)?.delete(clientId);
    }
    this.clients.delete(clientId);
    this.clientTopics.delete(clientId);
  }

  //  Subscribe / Unsubscribe 

  /** Subscribe a client to a topic. */
  subscribe(clientId: string, topic: string): void {
    if (!this.topicClients.has(topic)) {
      this.topicClients.set(topic, new Set());
    }
    this.topicClients.get(topic)!.add(clientId);
    this.clientTopics.get(clientId)?.add(topic);
  }

  /** Unsubscribe a client from a specific topic. */
  unsubscribe(clientId: string, topic: string): void {
    this.topicClients.get(topic)?.delete(clientId);
    this.clientTopics.get(clientId)?.delete(topic);
  }

  // Sends to all topic subscribers; dead sockets are pruned automatically.
  broadcast<T>(topic: string, message: OutboundMessage<T>): void {
    const subscribers = this.topicClients.get(topic);
    if (!subscribers || subscribers.size === 0) return;

    const payload = JSON.stringify(message);

    for (const clientId of [...subscribers]) {
      const client = this.clients.get(clientId);
      if (!client) {
        subscribers.delete(clientId);
        continue;
      }

      // WebSocket.OPEN === 1
      if (client.socket.readyState === 1) {
        client.socket.send(payload);
      } else {
        // Socket is dead — clean up
        subscribers.delete(clientId);
        this.removeClient(clientId);
      }
    }
  }

  //  Helpers 

  /** Build a canonical topic key from channel + optional params. */
  static makeTopic(channel: string, params?: Record<string, string>): string {
    if (!params || Object.keys(params).length === 0) return channel;
    // Sort keys so topic is deterministic regardless of param order
    const suffix = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return `${channel}::${suffix}`;
  }

  /** How many clients are on a given topic — useful for deciding when to stop polling. */
  subscriberCount(topic: string): number {
    return this.topicClients.get(topic)?.size ?? 0;
  }

  getClient(clientId: string): WsClient | undefined {
    return this.clients.get(clientId);
  }
}
