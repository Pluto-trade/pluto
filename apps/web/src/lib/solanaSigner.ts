import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { SOLANA_CHAIN, SOLANA_RPC_URL } from "@/lib/solana";

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
  const parsed = parseSolanaError(error);
  if (parsed) return parsed;

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

function parseSolanaError(error: unknown): string | null {
  const textParts: string[] = [];

  const collect = (value: unknown) => {
    if (!value) return;
    if (typeof value === "string") {
      textParts.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      collect(record.message);
      collect(record.reason);
      collect(record.error);
      collect(record.logs);
    }
  };

  collect(error);
  const text = textParts.join("\n");
  if (!text) return null;

  const anchorMatch = text.match(
    /Error Code:\s*([A-Za-z0-9_]+)\.\s*Error Message:\s*([^.\n]+\.?)/,
  );
  if (anchorMatch) {
    const [, code, message] = anchorMatch;
    if (code === "InsufficientAvailableBalance") {
      return "On-chain balance is insufficient for this order. Deposit more USDC/wSOL into the exchange first, or cancel open orders to unlock funds.";
    }
    return `${message.trim()} (${code})`;
  }

  if (
    text.includes("InsufficientAvailableBalance") ||
    text.includes("not have enough available balance")
  ) {
    return "On-chain balance is insufficient for this order. Deposit more USDC/wSOL into the exchange first, or cancel open orders to unlock funds.";
  }

  if (text.includes("custom program error: 0x1777")) {
    return "On-chain balance is insufficient for this order. Deposit more USDC/wSOL into the exchange first, or cancel open orders to unlock funds.";
  }

  if (text.includes("Blockhash not found")) {
    return "Transaction expired before it was signed. Try submitting the order again.";
  }

  if (text.includes("User rejected") || text.includes("rejected the request")) {
    return "Transaction was rejected in the wallet.";
  }

  return null;
}

async function assertTransactionSimulationSucceeds(transaction: Transaction) {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const result = await connection.simulateTransaction(transaction, undefined, false);

  if (result.value.err) {
    throw {
      message: "Transaction simulation failed.",
      logs: result.value.logs ?? [],
      error: JSON.stringify(result.value.err),
    };
  }
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function bytesToBase58(bytes: Uint8Array) {
  if (bytes.length === 0) return "";

  const digits = [0];
  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex += 1) {
    const byte = bytes[byteIndex];
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let output = "";
  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex += 1) {
    const byte = bytes[byteIndex];
    if (byte !== 0) break;
    output += BASE58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    output += BASE58_ALPHABET[digits[i]];
  }
  return output;
}

async function confirmSignature(signature: string) {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const result = await connection.confirmTransaction(signature, "confirmed");

  if (result.value.err) {
    throw {
      message: "Transaction confirmation failed.",
      error: JSON.stringify(result.value.err),
    };
  }
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
  privySignAndSendTransaction?: PrivySignAndSendTransaction;
}): Promise<string> {
  if (
    privyWallet &&
    privySignAndSendTransaction &&
    privyWallet.address.toLowerCase() === expectedAddress.toLowerCase()
  ) {
    const { signature } = await privySignAndSendTransaction({
      transaction,
      wallet: privyWallet,
      chain: SOLANA_CHAIN,
    });

    const encodedSignature = bytesToBase58(signature);
    await confirmSignature(encodedSignature);
    return encodedSignature;
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
  await assertTransactionSimulationSucceeds(parsedTransaction);

  if (phantom.signAndSendTransaction) {
    const { signature } = await phantom.signAndSendTransaction(parsedTransaction);
    await confirmSignature(signature);
    return signature;
  }

  if (!phantom.signTransaction) {
    throw new Error("Phantom does not support transaction signing in this browser.");
  }

  const signedTransaction = await phantom.signTransaction(parsedTransaction);
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
    skipPreflight: false,
  });
  await confirmSignature(signature);
  return signature;
}
