import { apiFetch } from "./client";

export interface PlaceOrderPayload {
  userId: string;
  marketId: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  size: number;
  price?: number;
  onchain?: {
    userPubkey: string;
    baseMint: string;
    quoteMint: string;
  };
}

export interface PlaceOrderResponse {
  orderId: string;
  orderBookResult?: {
    orderStatus: string;
    remainingQuantity: number;
  };
  protectionReports?: Array<{
    orderId: string;
    action: "cancelled";
    reason: string | null;
    message: string;
    displayMessage: string;
    quoteAgeMs: number | null;
    quotePrice: number | null;
    priceDeviation: number | null;
  }>;
  onchain?: {
    placeOrderTx: string | null;
    settlementTxs: Array<{ tradeId: string; transaction: string }>;
    settlementSkipped: string[];
    cancelOrderTxs: Array<{ orderId: string; transaction: string }>;
    cancelOrderSignatures?: Array<{ orderId: string; signature: string }>;
    warnings: string[];
    sequence: string[];
  };
}

export function placeOrder(payload: PlaceOrderPayload) {
  return apiFetch<PlaceOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelOrder(orderId: string, options?: {
  baseMint?: string;
  quoteMint?: string;
  userPubkey?: string;
}) {
  const params = new URLSearchParams();

  if (options?.baseMint) params.set("baseMint", options.baseMint);
  if (options?.quoteMint) params.set("quoteMint", options.quoteMint);
  if (options?.userPubkey) params.set("userPubkey", options.userPubkey);

  const query = params.toString();

  return apiFetch<{
    id: string;
    onchain?: {
      cancelOrderTx: string | null;
      cancelOrderSignature: string | null;
    };
  }>(`/orders/${orderId}${query ? `?${query}` : ""}`, {
    method: "DELETE",
  });
}
