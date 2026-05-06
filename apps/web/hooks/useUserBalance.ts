"use client";

import { useState, useCallback, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram, PROGRAM_ID } from "./useProgram";

export interface UserBalanceData {
  owner: PublicKey;
  tokenMint: PublicKey;
  availableAmount: bigint;
  lockedAmount: bigint;
  depositedAmount: bigint;
  withdrawnAmount: bigint;
  bump: number;
}

export function useUserBalance(tokenMint: PublicKey | null) {
  const { program, walletPublicKey } = useProgram();
  const [balance, setBalance] = useState<UserBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!program || !walletPublicKey || !tokenMint) return;

    setIsLoading(true);
    setError(null);

    try {
      const [userBalancePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user-balance"),
          walletPublicKey.toBuffer(),
          tokenMint.toBuffer(),
        ],
        PROGRAM_ID
      );

      const raw = await (program.account as any).userBalance.fetch(userBalancePda);

      setBalance({
        owner: raw.owner as PublicKey,
        tokenMint: raw.tokenMint as PublicKey,
        availableAmount: BigInt(raw.availableAmount.toString()),
        lockedAmount: BigInt(raw.lockedAmount.toString()),
        depositedAmount: BigInt(raw.depositedAmount.toString()),
        withdrawnAmount: BigInt(raw.withdrawnAmount.toString()),
        bump: raw.bump as number,
      });
    } catch (err: any) {
      if (err?.message?.includes("Account does not exist")) {
        setBalance(null);
      } else {
        setError(err?.message ?? "Failed to fetch balance");
        console.error("useUserBalance error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [program, walletPublicKey, tokenMint]);
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
}
