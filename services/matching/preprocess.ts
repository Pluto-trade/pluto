import type { Order, OrderType, Side } from "./types.ts";

export type NormalizedOrder = Order & { sequenceId: number };

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

  if (!normalizedType) {
    return { error: "Type must be either 'limit' or 'market'" };
  }

  if (!Number.isInteger(order.quantity) || order.quantity <= 0) {
    return { error: "Quantity must be a positive integer" };
  }

  if (!Number.isInteger(order.timestamp) || order.timestamp <= 0) {
    return { error: "Timestamp must be a positive integer" };
  }

  if (orderIdExists) {
    return { error: "Order ID already exists" };
  }

  if (normalizedType === "market") {
    return {
      order: {
        id: normalizedId,
        userId: normalizedUserId,
        symbol: normalizedSymbol,
        side: normalizedSide,
        type: "market",
        quantity: order.quantity,
        timestamp: order.timestamp,
        sequenceId: nextSequenceId,
      },
    };
  }

  const price = order.price;

  if (price === undefined || !Number.isInteger(price) || price <= 0) {
    return { error: "Price must be a positive integer for limit orders" };
  }

  return {
    order: {
      id: normalizedId,
      userId: normalizedUserId,
      symbol: normalizedSymbol,
      side: normalizedSide,
      type: "limit",
      price,
      quantity: order.quantity,
      timestamp: order.timestamp,
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

function normalizeType(type: string): OrderType | undefined {
  const normalizedType = type.trim().toLowerCase();
  if (normalizedType === "limit" || normalizedType === "market") {
    return normalizedType;
  }

  return undefined;
}
