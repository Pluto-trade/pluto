const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  if (typeof window !== "undefined") {
    const userId = window.localStorage.getItem("plut0x:userId");
    const walletAddress = window.localStorage.getItem("plut0x:walletAddress");

    if (userId) headers.set("x-user-id", userId);
    if (walletAddress) headers.set("x-wallet-address", walletAddress);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? `HTTP ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
}
