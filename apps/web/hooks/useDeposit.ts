"use client";

import { useState, useCallback } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { useProgram } from "./useProgram";

interface DepositParams {
  tokenMint: PublicKey;
  userTokenAccount: PublicKey;
  vaultTokenAccount: PublicKey;
  amount: number | bigint;
}

export function useDeposit() {
  const { program, walletPublicKey } = useProgram();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const deposit = useCallback(
    async ({ tokenMint, userTokenAccount, vaultTokenAccount, amount }: DepositParams) => {
      if (!program || !walletPublicKey) {
        setError("Wallet not connected or program not ready");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxSignature(null);

      try {
        const tx = await program.methods
          .deposit(new BN(amount.toString()))
          .accounts({
            user: walletPublicKey,
            tokenMint,
            userTokenAccount,
            vaultTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        setTxSignature(tx);
        console.log("deposit tx:", tx);
        return tx;
      } catch (err: any) {
        const msg = err?.message ?? "deposit failed";
        setError(msg);
        console.error("deposit error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [program, walletPublicKey]
  );

  return { deposit, isLoading, error, txSignature };
}
