import type { IndexedOrder } from "./internalTypes.ts";
import type { OrderBookPort } from "./orderBookPort.ts";
import type { ExecutionReport, Trade } from "./types.ts";
import type { NormalizedOrder } from "./preprocess.ts";

interface ExecuteMatchingResult {
  trades: Trade[];
  executionReports: ExecutionReport[];
  remainingQuantity: number;
}

export function executeMatching(
  incomingOrder: NormalizedOrder,
  orderBook: OrderBookPort,
  ordersById: Map<string, IndexedOrder>,
): ExecuteMatchingResult {
  const trades: Trade[] = [];
  const executionReports: ExecutionReport[] = [];
  let remainingQuantity = incomingOrder.quantity;
  const oppositeSide = incomingOrder.side === "buy" ? "sell" : "buy";

  while (remainingQuantity > 0) {
    const bestOppositePrice = orderBook.getBestPrice(
      incomingOrder.symbol,
      oppositeSide,
    );

    if (bestOppositePrice === undefined) {
      break;
    }

    if (!isPriceMatch(incomingOrder, bestOppositePrice)) {
      break;
    }

    const restingQueue = orderBook.getQueueAtPrice(
      incomingOrder.symbol,
      oppositeSide,
      bestOppositePrice,
    );

    if (!restingQueue || restingQueue.length === 0) {
      orderBook.deletePriceLevel(
        incomingOrder.symbol,
        oppositeSide,
        bestOppositePrice,
      );
      continue;
    }

    const bestOppositeOrder = restingQueue[0];
    const matchedQuantity = Math.min(
      remainingQuantity,
      bestOppositeOrder.remainingQuantity,
    );

    trades.push(
      createTrade(
        incomingOrder,
        bestOppositeOrder,
        matchedQuantity,
        trades.length + 1,
      ),
    );

    remainingQuantity -= matchedQuantity;
    bestOppositeOrder.remainingQuantity -= matchedQuantity;

    executionReports.push({
      orderId: bestOppositeOrder.id,
      status:
        bestOppositeOrder.remainingQuantity === 0
          ? "filled"
          : "partially_filled",
      filledQuantity: matchedQuantity,
      remainingQuantity: bestOppositeOrder.remainingQuantity,
    });

    if (bestOppositeOrder.remainingQuantity === 0) {
      restingQueue.shift();
      ordersById.delete(bestOppositeOrder.id);

      if (restingQueue.length === 0) {
        orderBook.deletePriceLevel(
          incomingOrder.symbol,
          oppositeSide,
          bestOppositePrice,
        );
      }
    }
  }

  return {
    trades,
    executionReports,
    remainingQuantity,
  };
}

function createTrade(
  incomingOrder: NormalizedOrder,
  restingOrder: { id: string; price: number; sequenceId: number },
  quantity: number,
  tradeNumber: number,
): Trade {
  return {
    tradeId: `${incomingOrder.sequenceId}-${restingOrder.sequenceId}-${tradeNumber}`,
    symbol: incomingOrder.symbol,
    price: restingOrder.price,
    quantity,
    buyOrderId:
      incomingOrder.side === "buy" ? incomingOrder.id : restingOrder.id,
    sellOrderId:
      incomingOrder.side === "sell" ? incomingOrder.id : restingOrder.id,
    makerOrderId: restingOrder.id,
    takerOrderId: incomingOrder.id,
    timestamp: incomingOrder.timestamp,
  };
}

function isPriceMatch(incomingOrder: NormalizedOrder, restingPrice: number): boolean {
  return incomingOrder.side === "buy"
    ? incomingOrder.price >= restingPrice
    : incomingOrder.price <= restingPrice;
}
