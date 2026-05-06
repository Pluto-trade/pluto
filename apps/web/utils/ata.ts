"use client";

/**
 * ata.ts — utilities for deriving Associated Token Accounts and reading
 * Used by the test page (and any component) to fill in the token account
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "../hooks/useProgram";

export async function getUserATA(
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  return getAssociatedTokenAddress(mint, owner);
}
export async function getVaultTokenAccount(
  program: Program,
  mint: PublicKey
): Promise<PublicKey> {
  const [custodyVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("custody"), mint.toBuffer()],
    PROGRAM_ID
  );
  const vault = await (program.account as any).custodyVault.fetch(
    custodyVaultPda
  );

  return vault.tokenVault as PublicKey;
}

export function getUserBalancePDA(user: PublicKey, mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user-balance"), user.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getUserProfilePDA(user: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), user.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export async function userProfileExists(
  connection: Connection,
  user: PublicKey
): Promise<boolean> {
  const pda = getUserProfilePDA(user);
  const info = await connection.getAccountInfo(pda);
  return info !== null;
}
