export const SOLANA_CHAIN =
  process.env.NEXT_PUBLIC_SOLANA_CHAIN === "mainnet"
    ? "solana:mainnet"
    : process.env.NEXT_PUBLIC_SOLANA_CHAIN === "testnet"
      ? "solana:testnet"
    : "solana:devnet";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function bytesToBase64(value: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < value.length; index += 1) {
    binary += String.fromCharCode(value[index]);
  }

  return btoa(binary);
}

export function getConfiguredMarketMints() {
  const baseMint = process.env.NEXT_PUBLIC_BASE_MINT;
  const quoteMint = process.env.NEXT_PUBLIC_QUOTE_MINT;

  if (!baseMint || !quoteMint) {
    return null;
  }

  return { baseMint, quoteMint };
}

export function getConfiguredVaultTokenAccounts() {
  const baseVaultTokenAccount = process.env.NEXT_PUBLIC_BASE_VAULT_TOKEN_ACCOUNT;
  const quoteVaultTokenAccount = process.env.NEXT_PUBLIC_QUOTE_VAULT_TOKEN_ACCOUNT;

  return {
    baseVaultTokenAccount,
    quoteVaultTokenAccount,
  };
}

export function solToLamports(sol: number): number {
  return Math.trunc(sol * 1_000_000_000);
}
