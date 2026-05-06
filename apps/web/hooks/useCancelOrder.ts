"use client";

import { useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";

interface CancelOrderParams {
  orderPubkey: PublicKey;
  escrowPubkey: PublicKey;
}

export function useCancelOrder() {
  const { program, walletPublicKey } = useProgram();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const cancelOrder = useCallback(
    async ({ orderPubkey, escrowPubkey }: CancelOrderParams) => {
      if (!program || !walletPublicKey) {
        setError("Wallet not connected or program not ready");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxSignature(null);

      try {
        const tx = await program.methods
          .cancelOrder()
          .accounts({
            user: walletPublicKey,
            order: orderPubkey,
            escrow: escrowPubkey,
          })
          .rpc();

        setTxSignature(tx);
        console.log("cancel_order tx:", tx);
        return tx;
      } catch (err: any) {
        const msg = err?.message ?? "cancel_order failed";
        setError(msg);
        console.error("cancel_order error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [program, walletPublicKey]
  );

  return { cancelOrder, isLoading, error, txSignature };
}
