"use client";

import { useEffect, useRef } from "react";
import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";

export function AppBar() {
    const { ready, authenticated, logout, user, linkWallet } = usePrivy();
    const { initOAuth, loading } = useLoginWithOAuth();
    const lastSyncedKey = useRef<string | null>(null);

    const handleGoogleLogin = async () => {
        await initOAuth({ provider: "google" });
    };

    const handleConnectWallet = async () => {
        await linkWallet();
    };

    const hasLinkedWallet =
        user?.linkedAccounts?.some((account) => account.type === "wallet") ?? false;

    const googleAccount = user?.linkedAccounts?.find(
        (account) => account.type === "google_oauth"
    );
    const walletAccounts = user?.linkedAccounts?.filter(
        (account) => account.type === "wallet"
    );

    const userEmail = googleAccount && "email" in googleAccount ? googleAccount.email : undefined;
    const userName = googleAccount && "name" in googleAccount ? googleAccount.name : undefined;
const walletAddress =
  walletAccounts && walletAccounts.length > 0
    ? walletAccounts[walletAccounts.length - 1].address
    : undefined;

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

    return (
        <nav
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
            }}
        >
            <div
                style={{
                    fontSize: "2rem",
                    fontWeight: 600,
                    lineHeight: 1,
                    color: "#111827",
                }}
            >
                galaxyExchange
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {!authenticated ? (
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={!ready || loading}
                        style={{
                            border: "1px solid #111827",
                            backgroundColor: "#111827",
                            color: "#ffffff",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 1rem",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: !ready || loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Opening Google..." : "Login with Google"}
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={handleConnectWallet}
                            style={{
                                border: "1px solid #111827",
                                backgroundColor: hasLinkedWallet ? "#047857" : "#111827",
                                color: "#ffffff",
                                borderRadius: "0.5rem",
                                padding: "0.5rem 1rem",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {hasLinkedWallet ? "Wallet Connected" : "Connect Wallet"}
                        </button>

                        <button
                            type="button"
                            onClick={logout}
                            style={{
                                border: "1px solid #6b7280",
                                backgroundColor: "#ffffff",
                                color: "#111827",
                                borderRadius: "0.5rem",
                                padding: "0.5rem 1rem",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Log out
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
