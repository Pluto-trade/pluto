"use client";

import { usePrivy } from "@privy-io/react-auth";
import { syncUserForWallet } from "@/lib/api/userSync";
import { base64ToBytes } from "@/lib/solana";
import { signAndSendSolanaTransaction } from "@/lib/solanaSigner";
import { useTradingStore } from "@/store/tradingStore";

export function useEnsureOnchainUser() {
  const { user } = usePrivy();
  const { setUserId } = useTradingStore();

  const googleAccount = user?.linkedAccounts?.find(
    (account) => account.type === "google_oauth",
  );
  const email =
    googleAccount && "email" in googleAccount
      ? googleAccount.email ?? undefined
      : undefined;
  const name =
    googleAccount && "name" in googleAccount
      ? googleAccount.name ?? undefined
      : undefined;

  return async (walletAddress: string) => {
    const synced = await syncUserForWallet({
      walletAddress,
      email,
      name,
      includeOnchain: true,
    });
    setUserId(synced.id);

    if (!synced.onchain?.createUserTx) {
      return synced;
    }

    await signAndSendSolanaTransaction({
      transaction: base64ToBytes(synced.onchain.createUserTx),
      expectedAddress: walletAddress,
    });

    return synced;
  };
}
