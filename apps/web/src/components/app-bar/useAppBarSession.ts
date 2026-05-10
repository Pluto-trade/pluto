"use client";

import { useEffect, useRef, useState } from "react";
import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";
import { useTradingStore } from "@/store/tradingStore";
import { syncUserForWallet } from "@/lib/api/userSync";
import { useActiveSolanaWallet } from "@/hooks/useActiveSolanaWallet";

export function useAppBarSession() {
    const { ready, authenticated, logout: privyLogout, user, linkWallet } = usePrivy();
    const { initOAuth, loading } = useLoginWithOAuth();
    const { phantomAddress } = useActiveSolanaWallet();
    const { setUserId } = useTradingStore();
    const lastSyncedKey = useRef<string | null>(null);
    const inFlightSyncKey = useRef<string | null>(null);
    const [oauthError, setOauthError] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<string | null>(null);

    const logout = async () => {
        await privyLogout();
        setUserId(null);
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("plut0x:walletAddress");
        }
        lastSyncedKey.current = null;
        inFlightSyncKey.current = null;
        setSyncError(null);
        setSyncStatus(null);
    };

    const googleAccount = user?.linkedAccounts?.find(
        (account) => account.type === "google_oauth"
    );
    const walletAccounts = user?.linkedAccounts?.filter((account) => account.type === "wallet");
    const walletAddress =
        phantomAddress ??
        (walletAccounts && walletAccounts.length > 0
            ? walletAccounts[walletAccounts.length - 1].address
            : undefined);

    const userEmail =
        googleAccount && "email" in googleAccount
            ? googleAccount.email
            : walletAddress
                ? `${walletAddress.toLowerCase()}@wallet.plut0x.local`
                : undefined;
    const userName =
        googleAccount && "name" in googleAccount
            ? googleAccount.name
            : walletAddress
                ? `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                : undefined;

    const hasLinkedWallet =
        user?.linkedAccounts?.some((account) => account.type === "wallet") ?? false;
    useEffect(() => {
        const syncUser = async () => {

            if (!authenticated || !userEmail || !userName || !walletAddress) {
                return;
            }

            const syncKey = `${userEmail}:${walletAddress}:backend`;
            if (lastSyncedKey.current === syncKey || inFlightSyncKey.current === syncKey) {
                return;
            }

            try {
                inFlightSyncKey.current = syncKey;
                setSyncError(null);
                setSyncStatus("Syncing account...");

                const data = await syncUserForWallet({
                    walletAddress,
                    email: userEmail,
                    name: userName,
                    includeOnchain: false,
                });

                setUserId(data.id);
                lastSyncedKey.current = syncKey;
                setSyncStatus("Backend account synced.");
            } catch (err) {
                setSyncError(err instanceof Error ? err.message : "Account sync failed.");
                setSyncStatus(null);
            } finally {
                if (inFlightSyncKey.current === syncKey) {
                    inFlightSyncKey.current = null;
                }
            }
        };

        void syncUser();
    }, [authenticated, userEmail, userName, walletAddress, setUserId]);

    const handleGoogleLogin = async () => {
        setOauthError(null);

        try {
            await initOAuth({ provider: "google" });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Google login failed";
            const isOriginError = message.toLowerCase().includes("origin not allowed");

            setOauthError(
                isOriginError
                    ? "Google login blocked: current origin is not whitelisted in Privy."
                    : message
            );
        }
    };

    const handleConnectWallet = async () => {
        setSyncError(null);
        setSyncStatus(hasLinkedWallet ? "Opening wallet selector..." : null);

        try {
            await linkWallet();
            setSyncStatus("Wallet connected. Syncing account...");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Wallet connection failed.";
            setSyncStatus(null);
            setSyncError(
                message.toLowerCase().includes("linking")
                    ? "This wallet is already linked to another account. Log out first, then connect the account you want to use."
                    : message,
            );
        }
    };

    return {
        authenticated,
        hasLinkedWallet,
        handleConnectWallet,
        handleGoogleLogin,
        loading,
        logout,
        oauthError,
        ready,
        syncError,
        syncStatus,
    };
}
