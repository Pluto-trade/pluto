"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"

export default function Provider({ children }: { children: React.ReactNode }) {
    return <PrivyProvider appId="cmodzr0hw00gu0dl9izom6a5h"
        config={{
            appearance: { walletChainType: 'solana-only' },
            externalWallets: {
                solana: { connectors: toSolanaWalletConnectors() }
            }
        }} >
                { children }
    </PrivyProvider>
}