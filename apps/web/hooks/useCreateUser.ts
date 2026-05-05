"use client";

import { useState, useCallback } from "react";
import { SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";

export function useCreateUser() {
  const { program, walletPublicKey } = useProgram();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const createUser = useCallback(async () => {
    if (!program || !walletPublicKey) {
      setError("Wallet not connected or program not ready");
      return null;
    }

    setIsLoading(true);
    setError(null);
    setTxSignature(null);

    try {
      // Anchor auto-derives the user_profile PDA from seeds
      const tx = await program.methods
        .createUser()
        .accounts({
          user: walletPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSignature(tx);
      console.log("create_user tx:", tx);
      return tx;
    } catch (err: any) {
      const msg = err?.message ?? "create_user failed";
      setError(msg);
      console.error("create_user error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, walletPublicKey]);

  return { createUser, isLoading, error, txSignature };
}
