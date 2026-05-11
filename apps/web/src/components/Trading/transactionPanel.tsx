"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTradingStore } from "@/store/tradingStore";
import { MarketComponent } from "./components/marketComponent";
import { MarketStats } from "./components/marketStats";
import { Button } from "../ui/button";
import { useBalances, usePlaceOrder } from "@/hooks/useApi";
import {
  base64ToBytes,
  getConfiguredMarketMints,
} from "@/lib/solana";
import { useActiveSolanaWallet } from "@/hooks/useActiveSolanaWallet";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import {
  getErrorMessage,
  signAndSendSolanaTransaction,
} from "@/lib/solanaSigner";
import { useEnsureOnchainUser } from "@/hooks/useEnsureOnchainUser";
import { cancelOrder } from "@/lib/api/orders";
import type { PlaceOrderResponse } from "@/lib/api/orders";

const TradingChart = dynamic(
  () => import("./components/charts/charts").then((mod) => mod.TradingChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center text-xs text-slate-500">
        Loading chart...
      </div>
    ),
  },
);

// ============ PLACEHOLDER COMPONENTS ============

export const LeftPanel = () => {
  return (
    <div className="grid grid-rows-[60%_40%] w-67.5 h-full gap-4 p-4 shrink-0">
      <MarketComponent />
      <MarketStats />
    </div>
  );
};

export const ChartPanel = () => {
  const { selectedTimeframe, setTimeframe } = useTradingStore();

  return (
    <div className="flex flex-col rounded-xl border-r border-[#1e222d] bg-[#081126]/90 p-2 h-full">
      {/* Timeframe Selector */}
      <div className="flex gap-1 p-4 border-b border-slate-700">
        {(["1m", "5m", "15m", "1h", "4h", "1d"] as const).map(
          (tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs rounded transition ${
                selectedTimeframe === tf
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {tf}
            </button>
          ),
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-hidden p-4">
        <TradingChart />
      </div>
    </div>
  );
};

export const OrderBookPanel = () => {
  const { orderBook } = useTradingStore();

  if (!orderBook) {
    return (
      <div className="p-4 text-center text-slate-400">
        Loading order book...
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-900 border-r border-slate-700 max-h-96">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase">
          Order Book
        </h3>
      </div>

      {/* TODO: Build order book table with asks/bids */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 text-slate-500 text-sm space-y-2">
          <div>Price (USD) | Size | Total</div>
          {/* Placeholder rows */}
          <div className="flex justify-between text-slate-600 text-xs">
            <span>$82,100.00</span>
            <span>1.5254</span>
            <span>125.2k</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs">
            <span>$82,099.50</span>
            <span>0.2359</span>
            <span>19.4k</span>
          </div>
        </div>
      </div>

      {/* Spread Info */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800">
        <div className="text-xs text-slate-400">Spread: $0.50 (0.0006%)</div>
      </div>
    </div>
  );
};

export const RecentTradesPanel = () => {
  const { recentTrades } = useTradingStore();

  return (
    <div className="flex flex-col bg-slate-900 border-r border-slate-700 max-h-96">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase">
          Recent Trades
        </h3>
      </div>

      {/* TODO: Build trades table with virtual scrolling */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 text-slate-500 text-sm space-y-2">
          <div className="text-xs grid grid-cols-4 gap-2 pb-2 border-b border-slate-700">
            <span>Time</span>
            <span>Side</span>
            <span>Price</span>
            <span>Size</span>
          </div>

          {recentTrades.length === 0 ? (
            <div className="text-center text-slate-600 py-4">No trades yet</div>
          ) : (
            recentTrades.slice(0, 10).map((trade) => (
              <div
                key={trade.id}
                className={`text-xs grid grid-cols-4 gap-2 py-1 ${
                  trade.side === "BUY" ? "text-green-400" : "text-red-400"
                }`}
              >
                <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                <span className="font-semibold">{trade.side}</span>
                <span>${trade.price.toFixed(2)}</span>
                <span>{trade.size.toFixed(4)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function balanceAssetForSymbol(asset: string) {
  return asset.toUpperCase() === "SOL" ? "wSOL" : asset;
}

function formatProtectionNotice(result: PlaceOrderResponse, signature?: string) {
  const report = result.protectionReports?.[0];
  if (!report) return null;

  const cancelledCount = result.protectionReports?.length ?? 1;
  const reason = report.displayMessage || report.reason || "market protection";
  const age = report.quoteAgeMs != null ? ` Quote age: ${report.quoteAgeMs}ms.` : "";
  const tx = signature ? ` New order submitted: ${signature}` : "";

  return `Stale/protected resting order detected. Cancelled ${cancelledCount} order${
    cancelledCount === 1 ? "" : "s"
  } due to ${reason}.${age}${tx}`;
}

export const TransactionPanel = () => {
  const {
    tradePanel,
    setOrderType,
    setTradeSide,
    setPrice,
    setSize,
    resetTradePanel,
    selectedMarketId,
    selectedSymbol,
    userId,
  } =
    useTradingStore();
  const placeOrderMutation = usePlaceOrder();
  const { data: balances = [] } = useBalances();
  const {
    wallet: activeWallet,
    signingAddress,
  } = useActiveSolanaWallet();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const ensureOnchainUser = useEnsureOnchainUser();
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txStatusTone, setTxStatusTone] = useState<"success" | "warning">("success");
  const [formError, setFormError] = useState<string | null>(null);

  const privySigningWallet =
    activeWallet?.address.toLowerCase() === signingAddress?.toLowerCase()
      ? activeWallet
      : null;
  const errorMessage = formError ?? placeOrderMutation.error?.message ?? null;

  const handlePlaceOrder = async () => {
    setFormError(null);
    setTxStatus(null);
    setTxStatusTone("success");

    const size = Number(tradePanel.size);
    const price =
      tradePanel.orderType === "LIMIT" ? Number(tradePanel.price) : undefined;

    if (!userId) {
      setFormError("Connect and sync your account before trading.");
      return;
    }

    if (!selectedMarketId) {
      setFormError("Select a market before placing an order.");
      return;
    }

    if (!Number.isFinite(size) || size <= 0) {
      setFormError("Enter a valid order size.");
      return;
    }

    if (
      tradePanel.orderType === "LIMIT" &&
      (!Number.isFinite(price) || !price || price <= 0)
    ) {
      setFormError("Enter a valid limit price.");
      return;
    }

    const marketMints = getConfiguredMarketMints();

    if (!marketMints) {
      setFormError(
        "Missing NEXT_PUBLIC_BASE_MINT or NEXT_PUBLIC_QUOTE_MINT. Restart the frontend after adding them.",
      );
      return;
    }

    if (!signingAddress) {
      setFormError("Connect a Solana wallet before placing an on-chain order.");
      return;
    }

    const [baseAssetForBalance, quoteAssetForBalance] = selectedSymbol.split("-");
    const requiredAsset = balanceAssetForSymbol(
      tradePanel.side === "BUY" ? quoteAssetForBalance : baseAssetForBalance,
    );
    const requiredAmount = tradePanel.side === "BUY" ? size * (price ?? 0) : size;
    const availableBalance =
      balances.find((balance) => balance.asset === requiredAsset)?.available ?? 0;

    if (availableBalance < requiredAmount) {
      setFormError(
        `Deposit ${requiredAsset} first. Available: ${availableBalance}, required: ${requiredAmount}.`,
      );
      return;
    }

    try {
      const synced = await ensureOnchainUser(signingAddress);
      let acceptedOrderId: string | null = null;

      const result = await placeOrderMutation.mutateAsync({
        userId: synced.id,
        marketId: selectedMarketId,
        side: tradePanel.side,
        type: tradePanel.orderType,
        size,
        price,
        onchain: {
          userPubkey: signingAddress,
          ...marketMints,
        },
      });
      acceptedOrderId = result.orderId;

      if (result.onchain?.placeOrderTx) {
        try {
          const signature = await signAndSendSolanaTransaction({
            transaction: base64ToBytes(result.onchain.placeOrderTx),
            expectedAddress: signingAddress,
            privyWallet: privySigningWallet,
            privySignAndSendTransaction: signAndSendTransaction,
          });

          const protectionNotice = formatProtectionNotice(result, signature);
          setTxStatus(protectionNotice ?? `Order submitted: ${signature}`);
          setTxStatusTone(protectionNotice ? "warning" : "success");
        } catch (error) {
          if (acceptedOrderId) {
            await cancelOrder(acceptedOrderId).catch(() => undefined);
          }
          throw error;
        }
      } else {
        const protectionNotice = formatProtectionNotice(result);
        if (protectionNotice) {
          setTxStatus(protectionNotice);
          setTxStatusTone("warning");
        } else if (result.onchain?.warnings?.length) {
          setTxStatus(result.onchain.warnings[0]);
          setTxStatusTone("warning");
        } else {
          setTxStatus("Order accepted by the matching engine.");
          setTxStatusTone("success");
        }
      }

      resetTradePanel();
    } catch (error) {
      setFormError(getErrorMessage(error, "Order failed."));
    }
  };

  // Parse symbol to get base and quote assets
  const [baseAsset, quoteAsset] = selectedSymbol.split('-');

  const total = parseFloat(tradePanel.price) * parseFloat(tradePanel.size) || 0;
  const youReceive = tradePanel.side === "BUY" ? parseFloat(tradePanel.size) : total;

  return (
    <div className="bg-[#081126]/90 border border-[#1e222d] mx-2 ml-4 rounded-xl p-4 my-2 w-80">
      <div className="space-y-4">
        {/* Order Type Toggle */}
        <div className="flex gap-2">
          {(["LIMIT", "MARKET"] as const).map((type) => (
            <Button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tradePanel.orderType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {type}
            </Button>
          ))}
        </div>

        {/* Side Toggle */}
        <div className="flex gap-2">
          {(["BUY", "SELL"] as const).map((side) => (
            <Button
              key={side}
              onClick={() => setTradeSide(side)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tradePanel.side === side
                  ? side === "BUY"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {side}
            </Button>
          ))}
        </div>

        {/* Price Input (only for LIMIT) */}
        {tradePanel.orderType === "LIMIT" && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Price ({quoteAsset})
            </label>
            <input
              type="number"
              value={tradePanel.price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-600 text-sm"
            />
          </div>
        )}

        {/* Size Input */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">
            Size ({baseAsset})
          </label>
          <input
            type="number"
            value={tradePanel.size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-600 text-sm"
          />
        </div>

        {/* Total */}
        <div className="bg-slate-800 rounded p-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total:</span>
            <span className="text-white font-semibold">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Fee */}
        <div className="text-xs text-slate-400 flex justify-between">
          <span>Est. Fee:</span>
          <span>${(total * 0.0003).toFixed(2)} (0.03%)</span>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={placeOrderMutation.isPending}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            tradePanel.side === "BUY"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {placeOrderMutation.isPending
            ? "Placing..."
            : `${tradePanel.side} ${tradePanel.size || "0"} ${baseAsset}`}
        </Button>

        {errorMessage && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {errorMessage}
          </p>
        )}

        {txStatus && (
          <p
            className={`rounded-md border px-3 py-2 text-xs ${
              txStatusTone === "warning"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
            }`}
          >
            {txStatus}
          </p>
        )}

        {/* You Receive */}
        {/* <div className="flex items-center justify-between text-slate-400 text-sm">
          <p>You Receive</p>
          <p>{youReceive.toFixed(2)} {tradePanel.side === "BUY" ? baseAsset : quoteAsset}</p>
        </div> */}
      </div>
    </div>
  );
};

// ============ BOTTOM SHEET ============
