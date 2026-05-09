import { apiFetch } from "./client";

export interface UserSyncResponse {
  id: string;
  email: string;
  name: string;
  wallet: string;
  onchain?: {
    createUserTx: string | null;
    userProfile: string;
    alreadyInitialized: boolean;
    skippedReason?: string;
  };
}

export function walletIdentity(walletAddress: string) {
  return {
    email: `${walletAddress.toLowerCase()}@wallet.plut0x.local`,
    name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
  };
}

export function syncUserForWallet({
  walletAddress,
  includeOnchain,
}: {
  walletAddress: string;
  includeOnchain: boolean;
}) {
  return apiFetch<UserSyncResponse>("/users/sync", {
    method: "POST",
    body: JSON.stringify({
      ...walletIdentity(walletAddress),
      walletAddress,
      includeOnchain,
    }),
  });
}
