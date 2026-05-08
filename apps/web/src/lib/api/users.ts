import { apiFetch } from "./client";
import type { Order } from "@/types/trading";

/** GET /users/:userId/orders — get order history for a specific user */
export async function getUserOrders(userId: string, limit = 100): Promise<Order[]> {
  const orders = await apiFetch<any[]>(`/users/${userId}/orders?limit=${limit}`);
  
  return orders.map(o => ({
    id: o.id,
    symbol: o.marketId, // We might want to resolve this to a symbol if the backend provides it, or keep marketId
    side: o.side,
    type: o.type,
    price: Number(o.price),
    size: Number(o.size),
    filled: Number(o.size) - Number(o.remainingSize),
    status: o.status,
    timestamp: new Date(o.createdAt).getTime(),
  }));
}

/** GET /orders/user/:userId/open — get open orders for a specific user */
export async function getUserOpenOrders(userId: string): Promise<Order[]> {
  const orders = await apiFetch<any[]>(`/orders/user/${userId}/open`);
  
  return orders.map(o => ({
    id: o.id,
    symbol: o.marketId,
    side: o.side,
    type: o.type,
    price: Number(o.price),
    size: Number(o.size),
    filled: Number(o.size) - Number(o.remainingSize),
    status: o.status,
    timestamp: new Date(o.createdAt).getTime(),
  }));
}
