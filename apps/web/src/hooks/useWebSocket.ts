import { useEffect, useRef } from "react";
import { useTradingStore } from "@/store/tradingStore";
import type { OrderBook } from "@/types/trading";
import { getMarketTrades } from "@/lib/api/trades";

// Shape of a single level as the backend sends it
interface BackendLevel {
  price: number;
  size: number;
  timestamp?: number;
  orders?: unknown[];
}

export const useWebSocket = () => {
  const {
    selectedMarketId,
    selectedSymbol,
    setOrderBook,
    addRecentTrade,
    setRecentTrades,
    setCurrentMarket,
    setWsConnected,
  } = useTradingStore();

  const FLUSH_INTERVAL_MS = 200;

  // Keep a stable ref to the latest marketId so the cleanup can unsubscribe
  // the correct market even if the effect re-runs before the socket closes.
  const marketIdRef = useRef(selectedMarketId);
  marketIdRef.current = selectedMarketId;

  const orderBookBufferRef = useRef<OrderBook | null>(null);
  const tradesBufferRef = useRef<any[]>([]);
  const tickerBufferRef = useRef<any | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Wait until useMarket has resolved the symbol → marketId
    if (!selectedMarketId) return;

    // 1. Fetch initial trades history
    getMarketTrades(selectedMarketId)
      .then((trades) => {
        setRecentTrades(trades);
      })
      .catch((err) => {
        console.error("[Trades] failed to fetch initial history:", err);
      });

    const ws = new WebSocket("ws://localhost:3001/ws");

    ws.onopen = () => {
      console.log("[WS] connected");
      setWsConnected(true);
      ["orderbook", "trades", "ticker"].forEach((channel) => {
        ws.send(
          JSON.stringify({
            action: "subscribe",
            channel,
            params: { marketId: selectedMarketId },
          }),
        );
      });
    };

    const startFlushLoop = () => {
      if (flushTimerRef.current) return;
      flushTimerRef.current = setInterval(() => {
        if (orderBookBufferRef.current) {
          setOrderBook(orderBookBufferRef.current);
          orderBookBufferRef.current = null;
        }

        if (tradesBufferRef.current.length > 0) {
          const buffered = tradesBufferRef.current;
          tradesBufferRef.current = [];
          for (const trade of buffered) {
            addRecentTrade(trade);
          }
        }

        if (tickerBufferRef.current) {
          setCurrentMarket(tickerBufferRef.current);
          tickerBufferRef.current = null;
        }
      }, FLUSH_INTERVAL_MS);
    };

    const stopFlushLoop = () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };

    startFlushLoop();

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

        orderBookBufferRef.current = orderBook;
      } else if (message.channel === "trades") {
        const trade = message.data;
        tradesBufferRef.current.push({
          id: `${trade.buyOrderId}-${trade.sellOrderId}-${trade.timestamp}`,
          symbol: selectedSymbol,
          price: trade.price,
          size: trade.size,
          side: "BUY", // Default for now
          timestamp: trade.timestamp,
        });
      } else if (message.channel === "ticker") {
        tickerBufferRef.current = {
          symbol: selectedSymbol,
          name: selectedSymbol,
          lastPrice: message.data.lastPrice,
          high24h: message.data.high24h,
          low24h: message.data.low24h,
          volume24h: message.data.volume24h,
          change24h: 0,
        };
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log("[WS] disconnected");
      setWsConnected(false);
      stopFlushLoop();
    };

    return () => {
      stopFlushLoop();
      // Unsubscribe cleanly before tearing down
      if (ws.readyState === WebSocket.OPEN) {
        ["orderbook", "trades", "ticker"].forEach((channel) => {
          ws.send(
            JSON.stringify({
              action: "unsubscribe",
              channel,
              params: { marketId: marketIdRef.current },
            }),
          );
        });
        ws.close();
      }
    };
    // Re-run whenever the resolved marketId changes (user switches symbol)
  }, [
    selectedMarketId,
    selectedSymbol,
    setOrderBook,
    addRecentTrade,
    setCurrentMarket,
    setWsConnected,
  ]);
};
