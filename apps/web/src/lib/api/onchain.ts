import { apiFetch } from "./client";

export interface CustodyInfo {
  custodyVault: string;
  tokenMint: string;
  tokenVault: string;
}

export function getCustodyInfo(tokenMint: string) {
  return apiFetch<CustodyInfo>(`/onchain/custody/${tokenMint}`);
}

export function buildDepositTx(payload: {
  userPubkey: string;
  tokenMint: string;
  userTokenAccount: string;
  vaultTokenAccount: string;
  amount: number;
}) {
  return apiFetch<{ transaction: string }>("/onchain/tx/deposit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function buildWithdrawTx(payload: {
  userPubkey: string;
  tokenMint: string;
  userTokenAccount: string;
  vaultTokenAccount: string;
  amount: number;
}) {
  return apiFetch<{ transaction: string }>("/onchain/tx/withdraw", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
