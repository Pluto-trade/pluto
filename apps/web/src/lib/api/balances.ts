import type { UserBalance } from "@/types/trading";
import { apiFetch } from "./client";

function mapBalance(balance: any): UserBalance {
  const available = Number(balance.available ?? 0);
  const reserved = Number(balance.reserved ?? balance.locked ?? 0);

  return {
    asset: balance.asset,
    available,
    locked: reserved,
    total: available + reserved,
  };
}

export async function getUserBalances(userId: string): Promise<UserBalance[]> {
  const balances = await apiFetch<any[]>(`/balances/user/${userId}`);
  return balances.map(mapBalance);
}

export function depositBalance(payload: {
  userId: string;
  asset: string;
  amount: number;
}) {
  return apiFetch<any>("/balances/deposit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function withdrawBalance(payload: {
  userId: string;
  asset: string;
  amount: number;
}) {
  return apiFetch<any>("/balances/withdraw", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
