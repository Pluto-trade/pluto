'use client';

import { useEffect } from 'react';
import { useMarket } from '@/hooks/useMarket';
import { TradingLayout } from '@/components/Trading/TradingLayout';
import {
  TradeDebugBoundary,
  tradeDebugError,
  tradeDebugLog,
} from '@/components/Trading/TradeDebugBoundary';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading market…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <p className="text-red-400 font-medium">Failed to load markets</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-1.5 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function NotFoundScreen({ symbol }: { symbol: string }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <p className="text-slate-300 font-medium">
          Market{' '}
          <span className="font-mono text-indigo-400">{symbol.toUpperCase()}</span>
          {' '}not found
        </p>
        <p className="text-sm text-slate-500">
          This market may not exist or is currently disabled.
        </p>
        <a
          href="/trade/sol-usdc"
          className="mt-3 px-4 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          Go to SOL-USDC
        </a>
      </div>
    </div>
  );
}

export function TradePageClient({ symbol }: { symbol: string }) {
  tradeDebugLog('TradePageClient: render start', { symbol });
  const { market, isLoading, error, notFound } = useMarket(symbol);

  useEffect(() => {
    tradeDebugLog('TradePageClient: mounted', { symbol });

    const onError = (event: ErrorEvent) => {
      tradeDebugError('window error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      tradeDebugError('window unhandledrejection', event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      tradeDebugLog('TradePageClient: unmounted', { symbol });
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [symbol]);

  useEffect(() => {
    tradeDebugLog('TradePageClient: market hook state', {
      symbol,
      marketId: market?.id,
      marketSymbol: market?.symbol,
      isLoading,
      error,
      notFound,
    });
  }, [error, isLoading, market?.id, market?.symbol, notFound, symbol]);

  if (isLoading) {
    tradeDebugLog('TradePageClient: return LoadingScreen');
    return <LoadingScreen />;
  }

  if (error) {
    tradeDebugLog('TradePageClient: return ErrorScreen', { error });
    return <ErrorScreen error={error} />;
  }

  if (notFound) {
    tradeDebugLog('TradePageClient: return NotFoundScreen', { symbol });
    return <NotFoundScreen symbol={symbol} />;
  }

  tradeDebugLog('TradePageClient: return TradingLayout', {
    marketId: market?.id,
    marketSymbol: market?.symbol,
  });

  return (
    <TradeDebugBoundary scope="TradingLayout">
      <TradingLayout />
    </TradeDebugBoundary>
  );
}
