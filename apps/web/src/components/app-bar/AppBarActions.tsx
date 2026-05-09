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
