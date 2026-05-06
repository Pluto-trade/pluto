"use client";

import { useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { useProgram } from "./useProgram";

interface WithdrawParams {
  tokenMint: PublicKey;
  vaultTokenAccount: PublicKey;
  userTokenAccount: PublicKey;
  amount: number | bigint;
}

export function useWithdraw() {
  const { program, walletPublicKey } = useProgram();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const withdraw = useCallback(
    async ({ tokenMint, vaultTokenAccount, userTokenAccount, amount }: WithdrawParams) => {
      if (!program || !walletPublicKey) {
        setError("Wallet not connected or program not ready");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxSignature(null);

      try {
        const tx = await program.methods
          .withdraw(new BN(amount.toString()))
          .accounts({
            user: walletPublicKey,
            tokenMint,
            vaultTokenAccount,
            userTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        setTxSignature(tx);
        console.log("withdraw tx:", tx);
        return tx;
      } catch (err: any) {
        const msg = err?.message ?? "withdraw failed";
        setError(msg);
        console.error("withdraw error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [program, walletPublicKey]
  );

  return { withdraw, isLoading, error, txSignature };
}
