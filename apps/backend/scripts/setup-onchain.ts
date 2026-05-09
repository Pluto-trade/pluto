import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  buildTransaction,
  getAuthorityKeypair,
  getConnection,
  getProgram,
  onchainPdas,
  sendSignedTx,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "../src/services/onchain";

const DEFAULT_BASE_MINT = "So11111111111111111111111111111111111111112";
const DEFAULT_QUOTE_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

function mintFromEnv(name: string, fallback: string): PublicKey {
  return new PublicKey(process.env[name] || fallback);
}

async function ensureExchange(feeBps: number) {
  const connection = getConnection();
  const program = getProgram() as any;
  const authority = getAuthorityKeypair();
  const exchange = onchainPdas.exchange();

  if (await connection.getAccountInfo(exchange)) {
    console.log(`exchange already initialized: ${exchange.toBase58()}`);
    return;
  }

  const signature = await program.methods
    .initialize(feeBps)
    .accounts({
      config: exchange,
      authority: authority.publicKey,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .signers([authority])
    .rpc();

  console.log(`initialized exchange: ${exchange.toBase58()} (${signature})`);
}

async function ensureCustody(label: string, mint: PublicKey) {
  const connection = getConnection();
  const program = getProgram() as any;
  const authority = getAuthorityKeypair();
  const custodyVault = onchainPdas.custodyVault(mint);

  if (await connection.getAccountInfo(custodyVault)) {
    const custody = await program.account.custodyVault.fetch(custodyVault);
    console.log(
      `${label} custody already initialized: ${custodyVault.toBase58()} vault=${custody.tokenVault.toBase58()}`,
    );
    return custody.tokenVault as PublicKey;
  }

  const vaultTokenAccount = Keypair.generate();
  const ix = await program.methods
    .initializeCustody()
    .accounts({
      custodyVault,
      tokenMint: mint,
      vaultTokenAccount: vaultTokenAccount.publicKey,
      authority: authority.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  const tx = await buildTransaction(ix, authority.publicKey);
  const signature = await sendSignedTx(tx, [authority, vaultTokenAccount]);
  console.log(
    `initialized ${label} custody: ${custodyVault.toBase58()} vault=${vaultTokenAccount.publicKey.toBase58()} (${signature})`,
  );
  return vaultTokenAccount.publicKey;
}

async function main() {
  const feeBps = Number(process.env.ONCHAIN_FEE_BPS || 25);
  const baseMint = mintFromEnv("BASE_MINT", DEFAULT_BASE_MINT);
  const quoteMint = mintFromEnv("QUOTE_MINT", DEFAULT_QUOTE_MINT);

  console.log("On-chain setup");
  console.log(`authority: ${getAuthorityKeypair().publicKey.toBase58()}`);
  console.log(`base mint: ${baseMint.toBase58()}`);
  console.log(`quote mint: ${quoteMint.toBase58()}`);

  await ensureExchange(feeBps);
  const baseVault = await ensureCustody("base", baseMint);
  const quoteVault = await ensureCustody("quote", quoteMint);

  console.log("\nFrontend env:");
  console.log(`NEXT_PUBLIC_BASE_MINT=${baseMint.toBase58()}`);
  console.log(`NEXT_PUBLIC_QUOTE_MINT=${quoteMint.toBase58()}`);
  console.log(`NEXT_PUBLIC_BASE_VAULT_TOKEN_ACCOUNT=${baseVault.toBase58()}`);
  console.log(`NEXT_PUBLIC_QUOTE_VAULT_TOKEN_ACCOUNT=${quoteVault.toBase58()}`);
  console.log(`NEXT_PUBLIC_SOLANA_CHAIN=devnet`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
