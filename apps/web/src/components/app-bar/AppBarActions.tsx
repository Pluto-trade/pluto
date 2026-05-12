import Link from "next/link";
import { User } from "lucide-react";
import { AppBarButton } from "./AppBarButton";

interface AppBarActionsProps {
    authenticated: boolean;
    hasLinkedWallet: boolean;
    loading: boolean;
    onConnectWallet: () => void;
    onGoogleLogin: () => void;
    onLogout: () => void;
    oauthError: string | null;
    ready: boolean;
    syncError: string | null;
    syncStatus: string | null;
}

export function AppBarActions({
    authenticated,
    hasLinkedWallet,
    loading,
    onConnectWallet,
    onGoogleLogin,
    onLogout,
    oauthError,
    ready,
    syncError,
    syncStatus,
}: AppBarActionsProps) {
    return (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <a
                href="https://dashboard.plut0x.xyz/"
                className="inline-flex min-h-10 items-center rounded-lg border border-cyan-400/40 bg-cyan-500 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition hover:border-cyan-300 hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
                Dashboard
            </a>

            {!authenticated ? (
                <>
                    <AppBarButton disabled={!ready || loading} onClick={onGoogleLogin} variant="primary">
                        {loading ? "Opening Google..." : "Login with Google"}
                    </AppBarButton>

                    {oauthError ? (
                        <span
                            style={{
                                color: "#b91c1c",
                                fontSize: "0.85rem",
                                fontWeight: 500,
                                maxWidth: "24rem",
                            }}
                        >
                            {oauthError}
                        </span>
                    ) : null}
                </>
            ) : (
                <>
                    <AppBarButton
                        onClick={onConnectWallet}
                        variant={hasLinkedWallet ? "success" : "primary"}
                    >
                        {hasLinkedWallet ? "Wallet Connected" : "Connect Wallet"}
                    </AppBarButton>

                    <Link
                        href="/profile"
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:border-cyan-500 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        <User aria-hidden="true" size={16} />
                        Profile
                    </Link>

                    <AppBarButton onClick={onLogout} variant="secondary">
                        Log out
                    </AppBarButton>

                    {syncError ? (
                        <span
                            style={{
                                color: "#fca5a5",
                                fontSize: "0.85rem",
                                fontWeight: 500,
                                maxWidth: "24rem",
                            }}
                        >
                            {syncError}
                        </span>
                    ) : syncStatus ? (
                        <span
                            style={{
                                color: "#93c5fd",
                                fontSize: "0.85rem",
                                fontWeight: 500,
                            }}
                        >
                            {syncStatus}
                        </span>
                    ) : null}
                </>
            )}
        </div>
    );
}
