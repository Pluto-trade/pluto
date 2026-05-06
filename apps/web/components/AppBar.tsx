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
        <nav className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-zinc-800 to-zinc-900 border-b border-zinc-700 shadow-lg">
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
