import type {
  CancelResult,
  MatchResult,
  Order,
  OrderBookSnapshot,
  RestingOrder,
} from "./types";
import type { IndexedOrder } from "./internalTypes.ts";
import { executeMatching } from "./matchingLoop.ts";
import type { OrderBookPort } from "./orderBookPort.ts";
import { normalizeSymbol, preprocessOrder } from "./preprocess.ts";
import { buildAcceptedResult, buildRejectedResult } from "./results.ts";
import { evaluate } from "@repo/mpe";
import type { Market } from "@repo/mpe";

export class MatchingEngine {
  private readonly ordersById = new Map<string, IndexedOrder>();
  private readonly orderBook: OrderBookPort;
  private readonly marketSnapshots = new Map<string, Market>();
  private nextSequenceId = 1;

  constructor(orderBook: OrderBookPort) {
    this.orderBook = orderBook;
  }

  updateMarket(symbol: string, market: Market): void {
    this.marketSnapshots.set(normalizeSymbol(symbol), market);
  }

  addOrder(order: Order): MatchResult {
    const preprocessResult = this.preprocessOrder(order);

    if (preprocessResult.error || !preprocessResult.order) {
      return buildRejectedResult(
        order.id,
        preprocessResult.error ?? "Order preprocessing failed",
      );
    }

    const incomingOrder = preprocessResult.order;
    const market = this.marketSnapshots.get(incomingOrder.symbol);

    if (market && incomingOrder.type === "limit") {
      const decision = evaluate(
        { id: incomingOrder.id, price: incomingOrder.price, side: incomingOrder.side, timestamp: incomingOrder.timestamp },
        { ...market, currentTime: Date.now() },
      );
      if (decision.decision === "CANCEL") {
        return buildRejectedResult(order.id, `MPE: ${decision.reason}`);
      }
    }

    const { trades, executionReports, remainingQuantity } = executeMatching(
      incomingOrder,
      this.orderBook,
      this.ordersById,
      market,
    );

    const result = buildAcceptedResult({
      incomingOrder,
      trades,
      executionReports,
      remainingQuantity,
    });

    if (result.restingOrder) {
      this.addRestingOrder(result.restingOrder);
    }

    return result;
  }

  cancelOrder(orderId: string): CancelResult {
    const indexedOrder = this.ordersById.get(orderId);

    if (!indexedOrder) {
      return {
        found: false,
        executionReport: {
          orderId,
          status: "rejected",
          filledQuantity: 0,
          remainingQuantity: 0,
          message: "Order not found",
        },
      };
    }

    const { order, side } = indexedOrder;
    const removed = this.orderBook.removeOrder(
      order.symbol,
      side,
      order.price,
      orderId,
    );

    if (
      removed &&
      this.orderBook.isPriceLevelEmpty(order.symbol, side, order.price)
    ) {
      this.orderBook.deletePriceLevel(order.symbol, side, order.price);
    }

    this.ordersById.delete(orderId);

    return {
      found: true,
      executionReport: {
        orderId,
        status: "cancelled",
        filledQuantity: 0,
        remainingQuantity: order.remainingQuantity,
      },
    };
  }

  getOrderBookSnapshot(symbol: string): OrderBookSnapshot {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    return this.orderBook.getOrderBookSnapshot(normalizedSymbol);
  }

  private preprocessOrder(order: Order) {
    const normalizedOrderId = order.id.trim();
    const preprocessResult = preprocessOrder(
      order,
      this.nextSequenceId,
      this.ordersById.has(normalizedOrderId),
    );

    if (preprocessResult.order) {
      this.nextSequenceId += 1;
    }

    return preprocessResult;
  }

  private normalizeSymbol(symbol: string): string {
    return normalizeSymbol(symbol);
  }

  private addRestingOrder(order: RestingOrder): void {
    this.orderBook.addRestingOrder(order);
    this.ordersById.set(order.id, {
      order,
      side: order.side,
    });
  }
}
