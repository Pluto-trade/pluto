import { useEffect } from 'react';
import { useTradingStore } from '@/store/tradingStore';
import type { OrderBook, Trade, Market } from '@/types/trading';

export const useWebSocket = () => {
  const { selectedSymbol, setOrderBook, addRecentTrade, setCurrentMarket, setWsConnected } =
    useTradingStore();

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);

      // Subscribe to orderbook
      ws.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          channel: 'orderbook',
          symbol: selectedSymbol,
        })
      );

      // Subscribe to trades
      ws.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          channel: 'trades',
          symbol: selectedSymbol,
        })
      );

      // Subscribe to ticker
      ws.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          channel: 'ticker',
          symbol: selectedSymbol,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.channel === 'orderbook') {
        setOrderBook(message.data as OrderBook);
      } else if (message.channel === 'trades') {
        addRecentTrade(message.data as Trade);
      } else if (message.channel === 'ticker') {
        setCurrentMarket(message.data as Market);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedSymbol, setOrderBook, addRecentTrade, setCurrentMarket, setWsConnected]);
};
