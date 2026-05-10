"use client";

import { useEffect, useState } from "react";
import { useTradingStore } from "@/store/tradingStore";

type ActiveOrderSnapshot = {
  orderId: string;
  marketId: string;
  marketSymbol: string | null;
  marketDisplay: string | null;
  side: string;
  size: number;
  entryPrice: number | null;
  markPrice: number | null;
  pnl: number | null;
};

type OrdersChannelPayload = {
  latestEvent: any | null;
  activeOrders: ActiveOrderSnapshot[];
};

export function useOrdersChannel() {
  const { userId } = useTradingStore();
  const [activeOrders, setActiveOrders] = useState<ActiveOrderSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setError(null);
          setLoading(false);
          // Subscribe to orders channel scoped to this userId
          ws?.send(
            JSON.stringify({
              action: "subscribe",
              channel: "orders",
              params: { userId, authUserId: userId },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.channel === "orders" && message.data) {
              const payload = message.data as OrdersChannelPayload;
              setActiveOrders(payload.activeOrders || []);
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        ws.onerror = () => {
          setError("WebSocket connection error");
          setLoading(false);
        };

        ws.onclose = () => {
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setLoading(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [userId]);

  return { activeOrders, loading, error };
}
