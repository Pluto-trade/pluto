import fs from "fs";
import path from "path";
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const DEFAULT_PROGRAM_ID = "6niVdPDPsNw2kCQ1XrupgnupLBPgcq6S68TwkEobCVGr";
const DEFAULT_RPC_URL = "http://127.0.0.1:8899";
const DEFAULT_IDL_PATH = path.resolve(
  process.cwd(),
  "../../on_chain/target/idl/on_chain.json",
);

let cachedProgram: anchor.Program | null = null;
let cachedConnection: Connection | null = null;
let cachedAuthority: Keypair | null = null;

function loadKeypair(keypairPath: string): Keypair {
  const raw = fs.readFileSync(keypairPath, "utf8");
  const secret = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secret);
}

export function getAuthorityKeypair(): Keypair {
  if (cachedAuthority) return cachedAuthority;

  const keypairPath =
    process.env.ONCHAIN_AUTHORITY_KEYPAIR ||
    process.env.ANCHOR_WALLET ||
    "";

  if (!keypairPath) {
    throw new Error(
      "Missing ONCHAIN_AUTHORITY_KEYPAIR or ANCHOR_WALLET for on-chain authority",
    );
  }

  cachedAuthority = loadKeypair(keypairPath);
  return cachedAuthority;
}

export function getConnection(): Connection {
  if (cachedConnection) return cachedConnection;
  const rpcUrl = process.env.ONCHAIN_RPC_URL || DEFAULT_RPC_URL;
  cachedConnection = new Connection(rpcUrl, "confirmed");
  return cachedConnection;
}

function getIdl(): anchor.Idl {
  const idlPath = process.env.ONCHAIN_IDL_PATH || DEFAULT_IDL_PATH;
  if (!fs.existsSync(idlPath)) {
    throw new Error(
      `On-chain IDL not found at ${idlPath}. Run anchor build or set ONCHAIN_IDL_PATH.`,
    );
  }
  return JSON.parse(fs.readFileSync(idlPath, "utf8")) as anchor.Idl;
}

function getProgramId(): PublicKey {
  return new PublicKey(process.env.ONCHAIN_PROGRAM_ID || DEFAULT_PROGRAM_ID);
}

export function getProgram(): anchor.Program {
  if (cachedProgram) return cachedProgram;

  const connection = getConnection();
  const authority = getAuthorityKeypair();
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(authority),
    { commitment: "confirmed" },
  );

  const idl = getIdl();
  (idl as any).address = getProgramId().toBase58();
  cachedProgram = new anchor.Program(idl as any, provider);
  return cachedProgram;
}

export const onchainPdas = {
  exchange: () =>
    PublicKey.findProgramAddressSync([Buffer.from("exchange")], getProgramId())[0],
  userProfile: (user: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("user"), user.toBuffer()],
      getProgramId(),
    )[0],
  custodyVault: (mint: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("custody"), mint.toBuffer()],
      getProgramId(),
    )[0],
  userBalance: (user: PublicKey, mint: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("user-balance"), user.toBuffer(), mint.toBuffer()],
      getProgramId(),
    )[0],
  order: (user: PublicKey, orderId: string) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("order"), user.toBuffer(), Buffer.from(orderId)],
      getProgramId(),
    )[0],
  escrow: (user: PublicKey, orderId: string) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), user.toBuffer(), Buffer.from(orderId)],
      getProgramId(),
    )[0],
  settlement: (tradeId: string) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("settlement"), Buffer.from(tradeId)],
      getProgramId(),
    )[0],
};

export function toBn(value: number | string): anchor.BN {
  if (typeof value === "string") return new anchor.BN(value);
  return new anchor.BN(Math.trunc(value));
}

export function toRawAmount(value: number | string, decimals: number): string {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  return Math.round(numeric * 10 ** decimals).toString();
}

export function toBaseRawAmount(value: number | string): string {
  return toRawAmount(value, 9);
}

export function toQuoteRawAmount(value: number | string): string {
  return toRawAmount(value, 6);
}

export async function buildTransaction(
  instruction:
    | anchor.web3.TransactionInstruction
    | anchor.web3.TransactionInstruction[],
  feePayer: PublicKey,
): Promise<Transaction> {
  const connection = getConnection();
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.feePayer = feePayer;
  tx.recentBlockhash = blockhash;
  tx.add(...(Array.isArray(instruction) ? instruction : [instruction]));
  return tx;
}

export function serializeTx(tx: Transaction): string {
  return tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");
}

export async function sendSignedTx(
  tx: Transaction,
  signers: Keypair[],
): Promise<string> {
  tx.sign(...signers);
  const connection = getConnection();
  return connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
  });
}

export const SYSTEM_PROGRAM_ID = anchor.web3.SystemProgram.programId;
export { TOKEN_PROGRAM_ID };
