import { apiFetch } from "./client";
import type { ApiMarket } from "@/types/trading";

/** GET /markets — list all markets */
export function listMarkets(): Promise<ApiMarket[]> {
  return apiFetch<ApiMarket[]>("/markets");
}

/** GET /markets/:marketId — single market by UUID */
export function getMarket(marketId: string): Promise<ApiMarket> {
  return apiFetch<ApiMarket>(`/markets/${marketId}`);
}
