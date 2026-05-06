"use client";

import { useEffect, useRef, useState } from "react";
import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";

export function useAppBarSession() {
    const { ready, authenticated, logout, user, linkWallet } = usePrivy();
    const { initOAuth, loading } = useLoginWithOAuth();
    const lastSyncedKey = useRef<string | null>(null);
    const [oauthError, setOauthError] = useState<string | null>(null);

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
            if (!authenticated || !userEmail || !userName || !walletAddress) {
                return;
            }

            const syncKey = `${userEmail}:${walletAddress}`;
            if (lastSyncedKey.current === syncKey) {
                return;
            }

            const res = await fetch("/api/users/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: userEmail,
                    name: userName,
                    walletAddress,
                }),
            });

            if (res.ok) {
                lastSyncedKey.current = syncKey;
            }
        };

        void syncUser();
    }, [authenticated, userEmail, userName, walletAddress]);

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