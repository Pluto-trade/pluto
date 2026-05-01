import type { MatchResult, OrderStatus, RestingOrder } from "./types.ts";
import type { NormalizedOrder } from "./preprocess.ts";

export function buildRejectedResult(orderId: string, message: string): MatchResult {
  return {
    trades: [],
    executionReports: [
      {
        orderId,
        status: "rejected",
        filledQuantity: 0,
        remainingQuantity: 0,
        message,
      },
    ],
    orderStatus: "rejected",
    remainingQuantity: 0,
  };
}

export function buildAcceptedResult(params: {
  incomingOrder: NormalizedOrder;
  trades: MatchResult["trades"];
  executionReports: MatchResult["executionReports"];
  remainingQuantity: number;
}): MatchResult {
  const { incomingOrder, trades, executionReports, remainingQuantity } = params;

  const incomingStatus: OrderStatus =
    remainingQuantity === 0
      ? "filled"
      : trades.length > 0
        ? "partially_filled"
        : "accepted";

  executionReports.push({
    orderId: incomingOrder.id,
    status: incomingStatus,
    filledQuantity: incomingOrder.quantity - remainingQuantity,
    remainingQuantity,
  });

  if (remainingQuantity > 0) {
    const restingOrder: RestingOrder = {
      ...incomingOrder,
      remainingQuantity,
    };

    executionReports.push({
      orderId: incomingOrder.id,
      status: "resting",
      filledQuantity: incomingOrder.quantity - remainingQuantity,
      remainingQuantity,
    });

    return {
      trades,
      executionReports,
      orderStatus: trades.length > 0 ? "partially_filled" : "resting",
      remainingQuantity,
      restingOrder,
    };
  }

  return {
    trades,
    executionReports,
    orderStatus: "filled",
    remainingQuantity: 0,
  };
}
