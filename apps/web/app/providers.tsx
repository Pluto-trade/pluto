"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { useState } from "react"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 5, // 5 seconds
            refetchInterval: 1000 * 5,
        },
    },
})

export default function Provider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <PrivyProvider appId="cmodzr0hw00gu0dl9izom6a5h"
                config={{
                    appearance: { walletChainType: 'solana-only' },
                    externalWallets: {
                        solana: { connectors: toSolanaWalletConnectors() }
                    }
                }} >
                { children }
            </PrivyProvider>
        </QueryClientProvider>
    )
}