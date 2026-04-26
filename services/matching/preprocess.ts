import type { Order, Side } from "./types.ts";

export interface NormalizedOrder extends Order {
  sequenceId: number;
}

export interface PreprocessResult {
  order?: NormalizedOrder;
  error?: string;
}

export function preprocessOrder(
  order: Order,
  nextSequenceId: number,
  orderIdExists: boolean,
): PreprocessResult {
  const normalizedSide = normalizeSide(order.side);
  const normalizedType = normalizeType(order.type);
  const normalizedSymbol = normalizeSymbol(order.symbol);
  const normalizedId = order.id.trim();
  const normalizedUserId = order.userId.trim();

  if (!normalizedId || !normalizedSymbol || !normalizedUserId) {
    return { error: "Order ID, user ID, and symbol are required" };
  }

  if (!normalizedSide) {
    return { error: "Side must be either 'buy' or 'sell'" };
  }

  if (normalizedType !== "limit") {
    return { error: "Only limit orders are supported" };
  }

  if (!Number.isInteger(order.quantity) || order.quantity <= 0) {
    return { error: "Quantity must be a positive integer" };
  }

  if (!Number.isInteger(order.price) || order.price <= 0) {
    return { error: "Price must be a positive integer" };
  }

  if (!Number.isInteger(order.timestamp) || order.timestamp <= 0) {
    return { error: "Timestamp must be a positive integer" };
  }

  if (orderIdExists) {
    return { error: "Order ID already exists" };
  }

  return {
    order: {
      ...order,
      id: normalizedId,
      userId: normalizedUserId,
      symbol: normalizedSymbol,
      side: normalizedSide,
      type: normalizedType,
      sequenceId: nextSequenceId,
    },
  };
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function normalizeSide(side: string): Side | undefined {
  const normalizedSide = side.trim().toLowerCase();
  if (normalizedSide === "buy" || normalizedSide === "sell") {
    return normalizedSide;
  }

  return undefined;
}

function normalizeType(type: string): "limit" | undefined {
  const normalizedType = type.trim().toLowerCase();
  if (normalizedType === "limit") {
    return normalizedType;
  }

  return undefined;
}
