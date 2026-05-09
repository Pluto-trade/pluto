"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import {
  getConnectedPhantomAddress,
  getPhantomProvider,
} from "@/lib/solanaSigner";

export function useActiveSolanaWallet() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);

  const linkedWalletAddress = useMemo(() => {
    const walletAccounts =
      user?.linkedAccounts?.filter((account) => account.type === "wallet") ?? [];
    const latestWallet = walletAccounts[walletAccounts.length - 1];

    return latestWallet && "address" in latestWallet
      ? latestWallet.address
      : undefined;
  }, [user?.linkedAccounts]);

  const wallet = useMemo(() => {
    if (!linkedWalletAddress) return wallets[0] ?? null;

    return (
      wallets.find(
        (item) =>
          item.address.toLowerCase() === linkedWalletAddress.toLowerCase(),
      ) ?? null
    );
  }, [linkedWalletAddress, wallets]);

  useEffect(() => {
    let cancelled = false;
    const phantom = getPhantomProvider();

    const refresh = async () => {
      const address = await getConnectedPhantomAddress({ prompt: false });
      if (!cancelled) setPhantomAddress(address);
    };

    void refresh();

    const handleAccountChanged = (...args: any[]) => {
      const nextPublicKey = args[0];
      setPhantomAddress(nextPublicKey?.toBase58?.() ?? nextPublicKey?.toString?.() ?? null);
    };

    phantom?.on?.("connect", handleAccountChanged);
    phantom?.on?.("accountChanged", handleAccountChanged);
    phantom?.on?.("disconnect", () => setPhantomAddress(null));

    return () => {
      cancelled = true;
      phantom?.off?.("connect", handleAccountChanged);
      phantom?.off?.("accountChanged", handleAccountChanged);
      phantom?.off?.("disconnect", () => setPhantomAddress(null));
    };
  }, []);

  const signingAddress = phantomAddress ?? wallet?.address ?? linkedWalletAddress;

  return {
    wallet,
    linkedWalletAddress,
    phantomAddress,
    signingAddress,
    wallets,
  };
}
