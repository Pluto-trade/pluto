"use client";

import { useMemo } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import IDL from "../idl/on_chain.json";

export const PROGRAM_ID = new PublicKey(
  "6niVdPDPsNw2kCQ1XrupgnupLBPgcq6S68TwkEobCVGr"
);

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "https://api.devnet.solana.com";

export function useProgram() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const program = useMemo(() => {
    if (!ready || !authenticated || !wallets || wallets.length === 0) return null;

    // Find a Solana wallet (check for chainType or walletClientType)
    const wallet = wallets.find(
      (w: any) => 
        w.chainType === "solana" || 
        w.walletClientType === "solana" ||
        (w.address && w.address.length > 20) // Solana addresses are 44 chars
    );
    
    if (!wallet) {
      console.warn("No Solana wallet found in wallets:", wallets);
      return null;
    }

    const connection = new Connection(RPC_ENDPOINT, "confirmed");

    const walletAdapter = {
      publicKey: new PublicKey(wallet.address),
      signTransaction: async (tx: any) => {
        try {
          const provider = await (wallet as any).getSolanaProvider();
          if (!provider) {
            throw new Error("Solana provider not available");
          }
          return provider.signTransaction(tx);
        } catch (err) {
          console.error("Error signing transaction:", err);
          throw err;
        }
      },
      signAllTransactions: async (txs: any) => {
        try {
          const provider = await (wallet as any).getSolanaProvider();
          if (!provider) {
            throw new Error("Solana provider not available");
          }
          return provider.signAllTransactions(txs);
        } catch (err) {
          console.error("Error signing all transactions:", err);
          throw err;
        }
      },
    };

    const provider = new AnchorProvider(connection, walletAdapter as any, {
      commitment: "confirmed",
    });

    return new Program(IDL as Idl, provider);
  }, [ready, authenticated, wallets]);

  const connection = useMemo(
    () => new Connection(RPC_ENDPOINT, "confirmed"),
    []
  );

  const walletPublicKey = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    
    const wallet = wallets.find(
      (w: any) => 
        w.chainType === "solana" || 
        w.walletClientType === "solana" ||
        (w.address && w.address.length > 20)
    );
    
    return wallet ? new PublicKey(wallet.address) : null;
  }, [wallets]);

  return { program, connection, walletPublicKey };
}