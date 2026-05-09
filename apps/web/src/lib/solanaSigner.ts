import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { bytesToBase64, SOLANA_CHAIN, SOLANA_RPC_URL } from "@/lib/solana";

type PrivySignAndSendTransaction = (input: {
  transaction: Uint8Array;
  wallet: any;
  chain: typeof SOLANA_CHAIN;
}) => Promise<{ signature: Uint8Array }>;

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  off?: (event: string, listener: (...args: any[]) => void) => void;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
};

export function getErrorMessage(error: unknown, fallback = "Transaction failed.") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      reason?: unknown;
      error?: unknown;
    };

    if (typeof candidate.message === "string" && candidate.message) {
      return candidate.message;
    }
    if (typeof candidate.reason === "string" && candidate.reason) {
      return candidate.reason;
    }
    if (typeof candidate.error === "string" && candidate.error) {
      return candidate.error;
    }
  }

  return fallback;
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;

  const candidate = (window as any).phantom?.solana ?? (window as any).solana;
  return candidate?.isPhantom ? candidate : null;
}

async function getPhantomPublicKey(provider: PhantomProvider): Promise<PublicKey> {
  if (provider.publicKey) return provider.publicKey;

  const connected = await provider.connect();
  return connected.publicKey;
}

export async function getConnectedPhantomAddress({
  prompt,
}: {
  prompt: boolean;
}): Promise<string | null> {
  const phantom = getPhantomProvider();
  if (!phantom) return null;

  if (phantom.publicKey) return phantom.publicKey.toBase58();

  try {
    const connected = await phantom.connect(prompt ? undefined : { onlyIfTrusted: true });
    return connected.publicKey.toBase58();
  } catch {
    return null;
  }
}

export async function signAndSendSolanaTransaction({
  transaction,
  expectedAddress,
  privyWallet,
  privySignAndSendTransaction,
}: {
  transaction: Uint8Array;
  expectedAddress: string;
  privyWallet?: any | null;
  privySignAndSendTransaction: PrivySignAndSendTransaction;
}): Promise<string> {
  if (
    privyWallet &&
    privyWallet.address.toLowerCase() === expectedAddress.toLowerCase()
  ) {
    const { signature } = await privySignAndSendTransaction({
      transaction,
      wallet: privyWallet,
      chain: SOLANA_CHAIN,
    });

    return bytesToBase64(signature);
  }

  const phantom = getPhantomProvider();
  if (!phantom) {
    throw new Error("Phantom is not available as a signing provider in this browser.");
  }

  const phantomPublicKey = await getPhantomPublicKey(phantom);
  if (phantomPublicKey.toBase58() !== expectedAddress) {
    throw new Error("Connected Phantom wallet does not match the transaction wallet.");
  }

  const parsedTransaction = Transaction.from(transaction);

  if (phantom.signAndSendTransaction) {
    const { signature } = await phantom.signAndSendTransaction(parsedTransaction);
    return signature;
  }

  if (!phantom.signTransaction) {
    throw new Error("Phantom does not support transaction signing in this browser.");
  }

  const signedTransaction = await phantom.signTransaction(parsedTransaction);
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  return connection.sendRawTransaction(signedTransaction.serialize(), {
    skipPreflight: false,
  });
}
