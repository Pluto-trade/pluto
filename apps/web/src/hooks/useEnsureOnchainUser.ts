"use client";

import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useActiveSolanaWallet } from "@/hooks/useActiveSolanaWallet";
import { syncUserForWallet } from "@/lib/api/userSync";
import { base64ToBytes } from "@/lib/solana";
import { signAndSendSolanaTransaction } from "@/lib/solanaSigner";
import { useTradingStore } from "@/store/tradingStore";

export function useEnsureOnchainUser() {
  const { wallet } = useActiveSolanaWallet();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { setUserId } = useTradingStore();

  return async (walletAddress: string) => {
    const synced = await syncUserForWallet({
      walletAddress,
      includeOnchain: true,
    });
    setUserId(synced.id);

    if (!synced.onchain?.createUserTx) {
      return synced;
    }

    await signAndSendSolanaTransaction({
      transaction: base64ToBytes(synced.onchain.createUserTx),
      expectedAddress: walletAddress,
      privyWallet: wallet,
      privySignAndSendTransaction: signAndSendTransaction,
    });

    return synced;
  };
}
