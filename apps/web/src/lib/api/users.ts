import { apiFetch } from "./client";
import type { Order, UserBalance } from "@/types/trading";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  wallets: Array<{
    id: string;
    address: string;
    chain?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  balances: UserBalance[];
}

/** GET /users/:userId/profile — get user profile, wallets, and balances */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const profile = await apiFetch<any>(`/users/${userId}/profile`);

  return {
    id: profile.id,
    name: profile.name ?? null,
    email: profile.email ?? null,
    wallets: Array.isArray(profile.wallets) ? profile.wallets : [],
    balances: Array.isArray(profile.balances)
      ? profile.balances.map((balance: any) => {
          const available = Number(balance.available ?? 0);
          const locked = Number(balance.locked ?? balance.reserved ?? 0);

          return {
            asset: balance.asset,
            available,
            locked,
            total: available + locked,
          };
        })
      : [],
  };
}

/** GET /users/:userId/orders — get order history for a specific user */
export async function getUserOrders(userId: string, limit = 100): Promise<Order[]> {
  const orders = await apiFetch<any[]>(`/users/${userId}/orders?limit=${limit}`);
  
  return orders.map(o => ({
    id: o.id,
    symbol: o.market?.symbol || o.marketId, 
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
    symbol: o.market?.symbol || o.marketId,
    side: o.side,
    type: o.type,
    price: Number(o.price),
    size: Number(o.size),
    filled: Number(o.size) - Number(o.remainingSize),
    status: o.status,
    timestamp: new Date(o.createdAt).getTime(),
  }));
}
