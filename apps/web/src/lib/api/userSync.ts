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
  email,
  name,
  includeOnchain,
}: {
  walletAddress: string;
  email?: string;
  name?: string;
  includeOnchain: boolean;
}) {
  const identity = email && name ? { email, name } : walletIdentity(walletAddress);

  const promise = apiFetch<UserSyncResponse>("/users/sync", {
    method: "POST",
    body: JSON.stringify({
      ...identity,
      walletAddress,
      includeOnchain,
    }),
  });

  return promise.then((response) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("plut0x:userId", response.id);
      window.localStorage.setItem("plut0x:walletAddress", walletAddress);
    }
    return response;
  });
}
