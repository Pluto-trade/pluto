import { useEffect, useRef } from "react";
import { useTradingStore } from "@/store/tradingStore";
import type { OrderBook } from "@/types/trading";

// Shape of a single level as the backend sends it
interface BackendLevel {
  price: number;
  size: number;
  timestamp?: number;
  orders?: unknown[];
}

export const useWebSocket = () => {
  const { selectedMarketId, selectedSymbol, setOrderBook, setWsConnected } =
    useTradingStore();

  // Keep a stable ref to the latest marketId so the cleanup can unsubscribe
  // the correct market even if the effect re-runs before the socket closes.
  const marketIdRef = useRef(selectedMarketId);
  marketIdRef.current = selectedMarketId;

  useEffect(() => {
    // Wait until useMarket has resolved the symbol → marketId
    if (!selectedMarketId) return;

    const ws = new WebSocket("ws://localhost:3001/ws");

    ws.onopen = () => {
      console.log("[WS] connected");
      setWsConnected(true);
      ws.send(
        JSON.stringify({
          action: "subscribe",
          channel: "orderbook",
          params: { marketId: selectedMarketId },
        }),
      );
    };

    ws.onmessage = (event) => {
      let message: any;
      try {
        message = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (message.channel === "orderbook") {
        // Map backend shape → frontend OrderBook type
        const data = message.data as {
          bids: BackendLevel[];
          asks: BackendLevel[];
          timestamp: number;
        };

        const orderBook: OrderBook = {
          symbol: selectedSymbol,
          bids: data.bids.map((l) => ({ price: l.price, size: l.size })),
          asks: data.asks.map((l) => ({ price: l.price, size: l.size })),
          timestamp: data.timestamp,
        };

        setOrderBook(orderBook);
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log("[WS] disconnected");
      setWsConnected(false);
    };

    return () => {
      // Unsubscribe cleanly before tearing down
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            action: "unsubscribe",
            channel: "orderbook",
            params: { marketId: marketIdRef.current },
          }),
        );
        ws.close();
      }
    };
    // Re-run whenever the resolved marketId changes (user switches symbol)
  }, [selectedMarketId, selectedSymbol, setOrderBook, setWsConnected]);
};
