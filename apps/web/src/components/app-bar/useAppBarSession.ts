"use client";

import { useEffect, useRef, useState } from "react";
import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";
import { useTradingStore } from "@/store/tradingStore";

export function useAppBarSession() {
    const { ready, authenticated, logout: privyLogout, user, linkWallet } = usePrivy();
    const { initOAuth, loading } = useLoginWithOAuth();
    const { setUserId } = useTradingStore();
    const lastSyncedKey = useRef<string | null>(null);
    const [oauthError, setOauthError] = useState<string | null>(null);

    const logout = async () => {
        await privyLogout();
        setUserId(null);
        lastSyncedKey.current = null;
    };

    const googleAccount = user?.linkedAccounts?.find(
        (account) => account.type === "google_oauth"
    );
    const walletAccounts = user?.linkedAccounts?.filter((account) => account.type === "wallet");

    const userEmail = googleAccount && "email" in googleAccount ? googleAccount.email : undefined;
    const userName = googleAccount && "name" in googleAccount ? googleAccount.name : undefined;
    const walletAddress =
        walletAccounts && walletAccounts.length > 0
            ? walletAccounts[walletAccounts.length - 1].address
            : undefined;

    const hasLinkedWallet =
        user?.linkedAccounts?.some((account) => account.type === "wallet") ?? false;

    useEffect(() => {
        const syncUser = async () => {
            console.log("Sync check:", {
                authenticated,
                userEmail,
                userName,
                walletAddress,
                googleAccount,
                walletAccounts,
            });

            if (!authenticated || !userEmail || !userName || !walletAddress) {
                console.log("Sync skipped - missing:", {
                    authenticated,
                    userEmail,
                    userName,
                    walletAddress,
                });
                return;
            }

            const syncKey = `${userEmail}:${walletAddress}`;
            if (lastSyncedKey.current === syncKey) {
                console.log("Already synced:", syncKey);
                return;
            }

            try {
                const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/users/sync";
                console.log("Syncing to:", apiUrl);
                const payload = {
                    email: userEmail,
                    name: userName,
                    walletAddress,
                };
                console.log("Payload:", payload);

                const res = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                console.log("Response status:", res.status);

                if (res.ok) {
                    lastSyncedKey.current = syncKey;
                    const data = await res.json();
                    console.log("User synced successfully:", data);
                    setUserId(data.id);
                } else {
                    const error = await res.json();
                    console.error("Sync failed:", res.status, error);
                }
            } catch (err) {
                console.error("Sync error:", err);
            }
        };

        void syncUser();
    }, [authenticated, userEmail, userName, walletAddress, googleAccount, walletAccounts, setUserId]);

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
        await linkWallet();
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
    };
}
