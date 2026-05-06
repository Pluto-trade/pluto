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
        <nav className="h-16 border-b border-white/5 bg-[#020817]/80 backdrop-blur-xl px-6 flex items-center justify-between">
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
