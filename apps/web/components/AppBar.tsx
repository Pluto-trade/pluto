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
                headers: { "Content-Type": "application/json" },
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
        <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[rgba(0,0,8,0.7)] px-6 py-4 backdrop-blur-md">
            <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold tracking-tight grad-cyan">
                    galaxyExchange
                </span>
                <span className="hidden text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-fg-dim)] sm:inline">
                    MPE Console
                </span>
            </div>

            <div className="flex items-center gap-2">
                {!authenticated ? (
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={!ready || loading}
                        className="rounded-lg border border-[var(--color-border-strong)] bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                    >
                        {loading ? "Opening Google…" : "Login with Google"}
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={handleConnectWallet}
                            className={
                                hasLinkedWallet
                                    ? "rounded-lg border border-[color-mix(in_oklab,var(--color-green)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-green)_15%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--color-green)] transition hover:bg-[color-mix(in_oklab,var(--color-green)_22%,transparent)]"
                                    : "rounded-lg border border-[var(--color-border-strong)] bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                            }
                        >
                            {hasLinkedWallet ? "Wallet Connected" : "Connect Wallet"}
                        </button>

                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-lg border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--color-fg-muted)] transition hover:text-white"
                        >
                            Log out
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
