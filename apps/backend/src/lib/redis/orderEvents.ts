import { getRedisClient } from ".";

const ORDER_EVENT_LIST_MAX = 1000;

export interface OrderEventPayload {
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

function orderEventsKey(userId: string): string {
  return `order-events:${userId}`;
}

export async function addOrderEvent(userId: string, payload: OrderEventPayload): Promise<void> {
  const client = getRedisClient();
  const raw = JSON.stringify(payload);
  await client.lPush(orderEventsKey(userId), raw);
  await client.lTrim(orderEventsKey(userId), 0, ORDER_EVENT_LIST_MAX - 1);
}

export async function getLatestOrderEvent(userId: string): Promise<OrderEventPayload | null> {
  const client = getRedisClient();
  const raw = await client.lIndex(orderEventsKey(userId), 0);
  if (!raw) return null;
  return JSON.parse(raw) as OrderEventPayload;
}
