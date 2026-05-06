"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana";
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import IDL from "../idl/on_chain.json";

export const PROGRAM_ID = new PublicKey(
  "6niVdPDPsNw2kCQ1XrupgnupLBPgcq6S68TwkEobCVGr"
);

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "https://api.devnet.solana.com";

export function useProgram() {
  const { ready, authenticated } = usePrivy();
  const { ready: walletsReady, wallets } = useSolanaWallets();

  const wallet = useMemo(() => wallets[0] ?? null, [wallets]);

  const program = useMemo(() => {
    if (!ready || !authenticated || !walletsReady || !wallet) return null;

    const connection = new Connection(RPC_ENDPOINT, "confirmed");

    const deserializeSignedTransaction = (
      originalTx: Transaction | VersionedTransaction,
      signedBytes: Uint8Array
    ) => {
      if (originalTx instanceof VersionedTransaction) {
        return VersionedTransaction.deserialize(signedBytes);
      }

      return Transaction.from(signedBytes);
    };

    const walletAdapter = {
      publicKey: new PublicKey(wallet.address),
      signTransaction: async (tx: Transaction | VersionedTransaction) => {
        const transaction = tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        const { signedTransaction } = await wallet.signTransaction({
          transaction,
          chain: "solana:devnet",
        });

        return deserializeSignedTransaction(tx, signedTransaction);
      },
      signAllTransactions: async (txs: Array<Transaction | VersionedTransaction>) => {
        return Promise.all(txs.map((tx) => walletAdapter.signTransaction(tx)));
      },
    };

    const provider = new AnchorProvider(connection, walletAdapter as any, {
      commitment: "confirmed",
    });

    return new Program(IDL as Idl, provider);
  }, [ready, authenticated, walletsReady, wallet]);

  const connection = useMemo(
    () => new Connection(RPC_ENDPOINT, "confirmed"),
    []
  );

  const walletPublicKey = useMemo(() => {
    return wallet ? new PublicKey(wallet.address) : null;
  }, [wallet]);

  return { program, connection, walletPublicKey, walletsReady, wallet };
}
