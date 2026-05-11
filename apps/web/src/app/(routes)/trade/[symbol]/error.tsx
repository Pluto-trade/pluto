"use client";

import { useEffect } from "react";

export default function TradeRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[plut0x:trade-debug]", "route error boundary", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-950 px-4 text-center">
      <div className="max-w-xl rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-left">
        <p className="text-sm font-semibold text-red-200">
          Trade route error
        </p>
        <p className="mt-2 text-xs text-red-100/80">{error.message}</p>
        {error.digest ? (
          <p className="mt-2 text-xs text-slate-400">Digest: {error.digest}</p>
        ) : null}
        <p className="mt-3 text-xs text-slate-400">
          Open the console and filter for [plut0x:trade-debug].
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-400"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
