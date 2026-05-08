import { apiFetch } from "./client";
import type { Trade } from "@/types/trading";

/** GET /orderbook/:marketId/trades — get recent trades for a market */
export async function getMarketTrades(marketId: string, limit = 50): Promise<Trade[]> {
  const trades = await apiFetch<any[]>(`/orderbook/${marketId}/trades?limit=${limit}`);
  
  return trades.map(t => ({
    id: t.id,
    symbol: "", // Symbol can be filled by the caller if needed
    price: Number(t.price),
    size: Number(t.size),
    side: "BUY", // Default to BUY since backend currently doesn't provide side
    timestamp: new Date(t.createdAt).getTime(),
  }));
}
