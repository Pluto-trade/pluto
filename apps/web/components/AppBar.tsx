"use client";

import { AppBarActions } from "./app-bar/AppBarActions";
import { AppBarBrand } from "./app-bar/AppBarBrand";
import { useAppBarSession } from "./app-bar/useAppBarSession";

export function AppBar() {
    const {
        authenticated,
        hasLinkedWallet,
        handleConnectWallet,
        handleGoogleLogin,
        loading,
        logout,
        oauthError,
        ready,
    } = useAppBarSession();

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
            <AppBarBrand />

            <AppBarActions
                authenticated={authenticated}
                hasLinkedWallet={hasLinkedWallet}
                loading={loading}
                onConnectWallet={handleConnectWallet}
                onGoogleLogin={handleGoogleLogin}
                onLogout={logout}
                oauthError={oauthError}
                ready={ready}
            />
        </nav>
    );
}
