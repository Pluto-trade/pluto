import type { IndexedOrder } from "./internalTypes.ts";
import type { OrderBookPort } from "./orderBookPort.ts";
import type { ExecutionReport, Trade } from "./types.ts";
import type { NormalizedOrder } from "./preprocess.ts";
import { evaluateWithContext } from "@repo/mpe";
import type { Market } from "@repo/mpe";

interface ExecuteMatchingResult {
  trades: Trade[];
  executionReports: ExecutionReport[];
  remainingQuantity: number;
}

export function executeMatching(
  incomingOrder: NormalizedOrder,
  orderBook: OrderBookPort,
  ordersById: Map<string, IndexedOrder>,
  market?: Market,
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

    const head = orderBook.peekHead(
      incomingOrder.symbol,
      oppositeSide,
      bestOppositePrice,
    );

    if (!head) {
      orderBook.deletePriceLevel(
        incomingOrder.symbol,
        oppositeSide,
        bestOppositePrice,
      );
      continue;
    }

    if (market) {
      const { decision, context } = evaluateWithContext(
        { id: head.id, price: head.price, side: head.side, timestamp: head.timestamp },
        { ...market, currentTime: Date.now() },
      );
      if (decision.decision === "CANCEL") {
        orderBook.removeHead(incomingOrder.symbol, oppositeSide, bestOppositePrice);
        ordersById.delete(head.id);
        executionReports.push({
          orderId: head.id,
          status: "cancelled",
          filledQuantity: 0,
          remainingQuantity: head.remainingQuantity,
          message: `MPE: ${decision.reason}`,
          mpe: {
            reason: decision.reason,
            priceDeviation: context.deviation,
            quotePrice: context.market.oraclePrice,
            quoteAgeMs: context.delay,
          },
        });
        if (orderBook.isPriceLevelEmpty(incomingOrder.symbol, oppositeSide, bestOppositePrice)) {
          orderBook.deletePriceLevel(incomingOrder.symbol, oppositeSide, bestOppositePrice);
        }
        continue;
      }
    }

    const matchedQuantity = Math.min(remainingQuantity, head.remainingQuantity);
    const headRemainingAfter = head.remainingQuantity - matchedQuantity;

    trades.push(
      createTrade(
        incomingOrder,
        head,
        matchedQuantity,
        trades.length + 1,
      ),
    );

    remainingQuantity -= matchedQuantity;
    orderBook.applyFillToHead(
      incomingOrder.symbol,
      oppositeSide,
      bestOppositePrice,
      matchedQuantity,
    );

    executionReports.push({
      orderId: head.id,
      status: headRemainingAfter === 0 ? "filled" : "partially_filled",
      filledQuantity: matchedQuantity,
      remainingQuantity: headRemainingAfter,
    });

    if (headRemainingAfter === 0) {
      orderBook.removeHead(
        incomingOrder.symbol,
        oppositeSide,
        bestOppositePrice,
      );
      ordersById.delete(head.id);

      if (
        orderBook.isPriceLevelEmpty(
          incomingOrder.symbol,
          oppositeSide,
          bestOppositePrice,
        )
      ) {
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
  if (incomingOrder.type === "market") {
    return true;
  }

  return incomingOrder.side === "buy"
    ? incomingOrder.price >= restingPrice
    : incomingOrder.price <= restingPrice;
}
