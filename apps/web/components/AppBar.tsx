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
        <nav className=""
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
