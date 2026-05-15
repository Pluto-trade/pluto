"use client";

import { useMemo, useState } from "react";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveSolanaWallet } from "@/hooks/useActiveSolanaWallet";
import { useTradingStore } from "@/store/tradingStore";
import { depositBalance, withdrawBalance } from "@/lib/api/balances";
import {
  buildDepositTx,
  buildWithdrawTx,
  getCustodyInfo,
} from "@/lib/api/onchain";
import {
  base64ToBytes,
  getConfiguredMarketMints,
  getConfiguredVaultTokenAccounts,
  solToLamports,
  SOLANA_RPC_URL,
} from "@/lib/solana";
import {
  getErrorMessage,
  signAndSendSolanaTransaction,
} from "@/lib/solanaSigner";
import { useEnsureOnchainUser } from "@/hooks/useEnsureOnchainUser";
import { useBalances, useUserProfile } from "@/hooks/useApi";

type Mode = "deposit" | "withdraw";

const ASSETS = ["USDC", "wSOL"] as const;

function resolveMint(asset: string) {
  const mints = getConfiguredMarketMints();
  if (!mints) return null;
  return asset === "wSOL" ? mints.baseMint : mints.quoteMint;
}

function resolveConfiguredVault(asset: string) {
  const vaults = getConfiguredVaultTokenAccounts();
  return asset === "wSOL"
    ? vaults.baseVaultTokenAccount
    : vaults.quoteVaultTokenAccount;
}

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatAmount(value: number) {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 1 ? 4 : 6,
  });
}

export function FundsPanel() {
  const userId = useTradingStore((state) => state.userId);
  const { wallet, signingAddress } = useActiveSolanaWallet();
  const ensureOnchainUser = useEnsureOnchainUser();
  const queryClient = useQueryClient();
  const { data: profile } = useUserProfile();
  const { data: balances = [] } = useBalances();
  const [mode, setMode] = useState<Mode>("deposit");
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("USDC");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mint = resolveMint(asset);
  const privySigningWallet =
    wallet?.address.toLowerCase() === signingAddress?.toLowerCase()
      ? wallet
      : null;
  const configuredVault = resolveConfiguredVault(asset);
  const displayedWallet = signingAddress ?? profile?.wallets?.[0]?.address;
  const displayedBalances = balances.length > 0 ? balances : profile?.balances ?? [];

  const custodyQuery = useQuery({
    queryKey: ["custody", mint],
    queryFn: () => getCustodyInfo(mint!),
    enabled: !!mint && !configuredVault,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setMessage(null);

      const parsedAmount = Number(amount);

      if (!userId) throw new Error("Connect your account first.");
      if (!signingAddress) throw new Error("Connect a Solana wallet first.");
      if (!mint) throw new Error("Set NEXT_PUBLIC_BASE_MINT and NEXT_PUBLIC_QUOTE_MINT.");
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid amount.");
      }

      const synced = await ensureOnchainUser(signingAddress);

      const user = new PublicKey(signingAddress);
      const tokenMint = new PublicKey(mint);
      const userTokenAccount = getAssociatedTokenAddressSync(tokenMint, user);
      const vaultTokenAccount =
        configuredVault ?? custodyQuery.data?.tokenVault;

      if (!vaultTokenAccount) {
        throw new Error("Custody vault token account is not available yet.");
      }

      const builder = mode === "deposit" ? buildDepositTx : buildWithdrawTx;
      const { transaction } = await builder({
        userPubkey: signingAddress,
        tokenMint: mint,
        userTokenAccount: userTokenAccount.toBase58(),
        vaultTokenAccount,
        amount: parsedAmount,
      });

      if (mode === "deposit" && asset === "wSOL") {
        const connection = new Connection(SOLANA_RPC_URL, "confirmed");
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        const wrapTx = new Transaction();
        wrapTx.feePayer = user;
        wrapTx.recentBlockhash = blockhash;
        wrapTx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            user,
            userTokenAccount,
            user,
            NATIVE_MINT,
          ),
          SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: userTokenAccount,
            lamports: solToLamports(parsedAmount),
          }),
          createSyncNativeInstruction(userTokenAccount),
        );

        await signAndSendSolanaTransaction({
          transaction: wrapTx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          }),
          expectedAddress: signingAddress,
          privyWallet: privySigningWallet,
        });
      }

      const signature = await signAndSendSolanaTransaction({
        transaction: base64ToBytes(transaction),
        expectedAddress: signingAddress,
        privyWallet: privySigningWallet,
      });

      const offchainPayload = {
        userId: synced.id,
        asset,
        amount: parsedAmount,
      };

      if (mode === "deposit") {
        await depositBalance(offchainPayload);
      } else {
        await withdrawBalance(offchainPayload);
      }

      return signature;
    },
    onSuccess: (signature) => {
      setAmount("");
      setMessage(`${mode === "deposit" ? "Deposit" : "Withdraw"} sent: ${signature}`);
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const actionLabel = useMemo(
    () => (mutation.isPending ? "Submitting..." : mode === "deposit" ? "Deposit" : "Withdraw"),
    [mode, mutation.isPending],
  );

  return (
    <div className="rounded-xl border border-[#1e222d] bg-[#081126]/90 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[14px] font-semibold text-white">Funds</h4>
        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
          {(["deposit", "withdraw"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`min-h-10 rounded-md px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                mode === item ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {item === "deposit" ? "Deposit" : "Withdraw"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-[0.95fr_1.35fr] gap-2 text-xs">
        <div className="min-w-0 rounded-md border border-slate-800 bg-slate-950/40 p-2">
          <span className="block text-[10px] uppercase tracking-wide text-slate-500">
            Account
          </span>
          <p className="mt-1 truncate font-medium text-slate-200">
            {profile?.name || profile?.email || (userId ? shortAddress(userId) : "Not connected")}
          </p>
          {displayedWallet ? (
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {shortAddress(displayedWallet)}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 rounded-md border border-slate-800 bg-slate-950/40 p-2">
          <div className="mb-1 grid grid-cols-[0.7fr_1fr_1fr] gap-2 text-[10px] uppercase tracking-wide text-slate-500">
            <span>Asset</span>
            <span className="text-right">Available</span>
            <span className="text-right">Locked</span>
          </div>
          {displayedBalances.length > 0 ? (
            displayedBalances.map((balance) => (
              <div
                key={balance.asset}
                className="grid grid-cols-[0.7fr_1fr_1fr] gap-2 py-0.5 text-[11px] text-slate-300"
              >
                <span className="font-medium text-slate-200">{balance.asset}</span>
                <span className="text-right">{formatAmount(balance.available)}</span>
                <span className="text-right text-slate-500">
                  {formatAmount(balance.locked)}
                </span>
              </div>
            ))
          ) : (
            <p className="py-1 text-[11px] text-slate-500">No balances yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[0.8fr_1fr_auto] gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] text-slate-400">Asset</span>
          <select
            value={asset}
            onChange={(event) => setAsset(event.target.value as (typeof ASSETS)[number])}
            className="min-h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          >
            {ASSETS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] text-slate-400">Amount</span>
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="min-h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            placeholder="0"
            autoComplete="off"
          />
        </label>

        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="mt-5 min-h-10 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-cyan-200">{message}</p> : null}
      {custodyQuery.error ? (
        <p className="mt-2 text-xs text-amber-300">
          Custody not initialized for {asset}.
        </p>
      ) : null}
    </div>
  );
}
