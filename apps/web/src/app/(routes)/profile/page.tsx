"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw, Wallet } from "lucide-react";
import {
  useBalances,
  useOpenOrders,
  useUserOrders,
  useUserProfile,
} from "@/hooks/useApi";
import { useTradingStore } from "@/store/tradingStore";

function shortAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatAmount(value: number) {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 1 ? 4 : 6,
  });
}

function formatTime(timestamp: number) {
  if (!timestamp) return "-";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

export default function ProfilePage() {
  const { userId } = useTradingStore();
  const profileQuery = useUserProfile();
  const balancesQuery = useBalances();
  const openOrdersQuery = useOpenOrders();
  const orderHistoryQuery = useUserOrders(10);

  const balances = balancesQuery.data?.length
    ? balancesQuery.data
    : profileQuery.data?.balances ?? [];
  const isLoading =
    profileQuery.isLoading ||
    balancesQuery.isLoading ||
    openOrdersQuery.isLoading ||
    orderHistoryQuery.isLoading;
  const hasError =
    profileQuery.isError ||
    balancesQuery.isError ||
    openOrdersQuery.isError ||
    orderHistoryQuery.isError;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#020518] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-normal">Profile</h1>
            <p className="mt-2 text-sm text-slate-400">
              Account, wallet, balances, and recent activity.
            </p>
          </div>

          <Link
            href="/markets"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            Markets
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>

        {!userId ? (
          <section className="rounded-lg border border-slate-800 bg-[#081126] p-6">
            <h2 className="text-lg font-semibold">No synced account</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Log in and connect your Solana wallet from the top bar. Once the
              backend sync finishes, your profile will appear here.
            </p>
          </section>
        ) : hasError ? (
          <section className="rounded-lg border border-red-900/70 bg-red-950/20 p-6">
            <h2 className="text-lg font-semibold text-red-100">
              Could not load profile
            </h2>
            <button
              type="button"
              onClick={() => {
                void profileQuery.refetch();
                void balancesQuery.refetch();
                void openOrdersQuery.refetch();
                void orderHistoryQuery.refetch();
              }}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-500/60 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Retry
            </button>
          </section>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-lg border border-slate-800 bg-[#081126] p-5">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Account
              </span>
              {isLoading ? (
                <div className="mt-4 space-y-3">
                  <div className="h-6 w-48 rounded bg-slate-800" />
                  <div className="h-4 w-72 rounded bg-slate-800" />
                </div>
              ) : (
                <>
                  <h2 className="mt-3 text-2xl font-semibold">
                    {profileQuery.data?.name ||
                      profileQuery.data?.email ||
                      shortAddress(userId)}
                  </h2>
                  <p className="mt-1 break-all text-sm text-slate-400">
                    {profileQuery.data?.email || userId}
                  </p>
                </>
              )}

              <div className="mt-6 space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Wallets
                </span>
                {profileQuery.data?.wallets?.length ? (
                  profileQuery.data.wallets.map((wallet) => (
                    <div
                      key={wallet.id ?? wallet.address}
                      className="flex min-h-11 items-center gap-3 rounded-md border border-slate-800 bg-slate-950/40 px-3"
                    >
                      <Wallet aria-hidden="true" size={16} className="text-cyan-300" />
                      <span className="break-all text-sm text-slate-200">
                        {shortAddress(wallet.address)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-3 text-sm text-slate-500">
                    No wallet linked yet.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-[#081126] p-5">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Balances
              </span>
              <div className="mt-3 overflow-hidden rounded-md border border-slate-800">
                <div className="grid grid-cols-4 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-500">
                  <span>Asset</span>
                  <span className="text-right">Available</span>
                  <span className="text-right">Locked</span>
                  <span className="text-right">Total</span>
                </div>
                {isLoading ? (
                  <div className="space-y-2 p-3">
                    <div className="h-5 rounded bg-slate-800" />
                    <div className="h-5 rounded bg-slate-800" />
                  </div>
                ) : balances.length ? (
                  balances.map((balance) => (
                    <div
                      key={balance.asset}
                      className="grid grid-cols-4 border-t border-slate-800 px-3 py-3 text-sm text-slate-300"
                    >
                      <span className="font-semibold text-slate-100">
                        {balance.asset}
                      </span>
                      <span className="text-right">
                        {formatAmount(balance.available)}
                      </span>
                      <span className="text-right text-slate-500">
                        {formatAmount(balance.locked)}
                      </span>
                      <span className="text-right">
                        {formatAmount(balance.total)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="border-t border-slate-800 px-3 py-4 text-sm text-slate-500">
                    No balances yet.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-[#081126] p-5">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Open Orders
              </span>
              <div className="mt-3 space-y-2">
                {openOrdersQuery.data?.length ? (
                  openOrdersQuery.data.slice(0, 6).map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-5 gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-3 text-sm"
                    >
                      <span>{order.symbol}</span>
                      <span className={order.side === "BUY" ? "text-green-400" : "text-red-400"}>
                        {order.side}
                      </span>
                      <span>{order.price}</span>
                      <span>{order.size}</span>
                      <span className="text-right text-slate-500">{order.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-4 text-sm text-slate-500">
                    No open orders.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-[#081126] p-5">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Recent Orders
              </span>
              <div className="mt-3 space-y-2">
                {orderHistoryQuery.data?.length ? (
                  orderHistoryQuery.data.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-5 gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-3 text-sm"
                    >
                      <span className="text-slate-500">{formatTime(order.timestamp)}</span>
                      <span>{order.symbol}</span>
                      <span className={order.side === "BUY" ? "text-green-400" : "text-red-400"}>
                        {order.side}
                      </span>
                      <span>{order.size}</span>
                      <span className="text-right text-slate-500">{order.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-4 text-sm text-slate-500">
                    No order history yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
