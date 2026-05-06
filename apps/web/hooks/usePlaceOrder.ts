"use client";

import { useState, useCallback } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { useProgram } from "./useProgram";
export type OrderSide =
  | { buy: Record<string, never> }
  | { sell: Record<string, never> };
export type OrderType =
  | { limit: Record<string, never> }
  | { market: Record<string, never> };

export interface PlaceOrderParams {
  orderId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  price: number | bigint;
  quantity: number | bigint;
  tokenMint: PublicKey;
}

export function usePlaceOrder() {
  const { program, walletPublicKey } = useProgram();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const placeOrder = useCallback(
    async ({
      orderId,
      symbol,
      side,
      orderType,
      price,
      quantity,
      tokenMint,
    }: PlaceOrderParams) => {
      if (!program || !walletPublicKey) {
        setError("Wallet not connected or program not ready");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxSignature(null);

      try {
        const args = {
          orderId,
          symbol,
          side,
          orderType,
          price: new BN(price.toString()),
          quantity: new BN(quantity.toString()),
        };

        const tx = await program.methods
          .placeOrder(args)
          .accounts({
            user: walletPublicKey,
            tokenMint,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        setTxSignature(tx);
        console.log("place_order tx:", tx);
        return tx;
      } catch (err: any) {
        const msg = err?.message ?? "place_order failed";
        setError(msg);
        console.error("place_order error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [program, walletPublicKey],
  );

  return { placeOrder, isLoading, error, txSignature };
}
