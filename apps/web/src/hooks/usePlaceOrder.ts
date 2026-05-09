"use client";

import { useState } from "react";
import { useTradingStore } from "@/store/tradingStore";

export interface PlaceOrderRequest {
  userId: string;
  marketId: string;
  side: "BUY" | "SELL";
  size: number;
  price: number;
  type: "LIMIT" | "MARKET";
}

export interface PlaceOrderResponse {
  id: string;
  userId: string;
  marketId: string;
  side: string;
  price: number;
  size: number;
  type: string;
  status: string;
  createdAt: string;
}

export function usePlaceOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const placeOrder = async (request: PlaceOrderRequest): Promise<PlaceOrderResponse | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/orders`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Order placement failed with status ${response.status}`);
      }

      const data: PlaceOrderResponse = await response.json();
      setSuccess(true);
      setLoading(false);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to place order";
      setError(message);
      setLoading(false);
      return null;
    }
  };

  return { placeOrder, loading, error, success };
}
