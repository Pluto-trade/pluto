"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMarkets } from "@/lib/api/markets";
import { useTradingStore } from "@/store/tradingStore";
import type { ApiMarket } from "@/types/trading";

/**
 * Resolves a URL slug ("sol-usdc") → ApiMarket, then writes
 * selectedMarketId + selectedSymbol into the store so all
 * other hooks/components automatically target the right market.
 */

/** "sol-usdc" → "SOL-USDC",  "SOL_USDC" → "SOL-USDC" */
function normalizeSymbol(raw: string): string {
  return raw.toUpperCase().replace(/_/g, "-");
}

interface UseMarketResult {
  market: ApiMarket | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useMarket(symbolFromUrl: string): UseMarketResult {
  const { setSelectedMarketId, setSelectedSymbol } = useTradingStore();
  const normalizedSymbol = normalizeSymbol(symbolFromUrl);

  const {
    data: markets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["markets"],
    queryFn: listMarkets,
    staleTime: 60_000, // markets rarely change
    retry: 2,
  });

  const market = markets?.find((m) => m.symbol === normalizedSymbol) ?? null;

  // Push into the store so WS hooks and components pick up the new marketId
  useEffect(() => {
    if (!market) return;
    setSelectedMarketId(market.id);
    setSelectedSymbol(market.symbol);
  }, [market?.id, setSelectedMarketId, setSelectedSymbol]);

  return {
    market,
    isLoading,
    error: error ? (error as Error).message : null,
    notFound: !isLoading && !error && !!markets && !market,
  };
}
