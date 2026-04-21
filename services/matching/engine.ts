import type {
  CancelResult,
  MatchResult,
  Order,
  OrderBookSnapshot,
  RestingOrder,
  Trade,
  ExecutionReport,
  BookLevel,
} from "./types";

export class MatchingEngine {
  private bids: RestingOrder[] = [];
  private asks: RestingOrder[] = [];
  private ordersById: Map<string, RestingOrder> = new Map();

  addOrder(order: Order): MatchResult {
    const trades: Trade[] = [];
    const executionReports: ExecutionReport[] = [];
    let remainingQuantity = order.quantity;
    const oppositeOrders = order.side === "buy" ? this.asks : this.bids;

    this.sortBook(this.bids, "buy");
    this.sortBook(this.asks, "sell");

    while (remainingQuantity > 0 && oppositeOrders.length > 0) {
      const bestOppositeOrder = oppositeOrders[0];

      if (!this.isPriceMatch(order, bestOppositeOrder)) {
        break;
      }

      const matchedQuantity = Math.min(
        remainingQuantity,
        bestOppositeOrder.remainingQuantity,
      );
      const trade: Trade = {
        tradeId: `${order.id}-${bestOppositeOrder.id}-${Date.now()}-${trades.length + 1}`,
        symbol: order.symbol,
        price: bestOppositeOrder.price,
        quantity: matchedQuantity,
        buyOrderId: order.side === "buy" ? order.id : bestOppositeOrder.id,
        sellOrderId: order.side === "sell" ? order.id : bestOppositeOrder.id,
        timestamp: Date.now(),
      };

      trades.push(trade);
      remainingQuantity -= matchedQuantity;
      bestOppositeOrder.remainingQuantity -= matchedQuantity;

      executionReports.push({
        orderId: bestOppositeOrder.id,
        status:
          bestOppositeOrder.remainingQuantity === 0 ? "filled" : "partially_filled",
        filledQuantity: matchedQuantity,
        remainingQuantity: bestOppositeOrder.remainingQuantity,
      });

      if (bestOppositeOrder.remainingQuantity === 0) {
        oppositeOrders.shift();
        this.ordersById.delete(bestOppositeOrder.id);
      }
    }

    executionReports.push({
      orderId: order.id,
      status: remainingQuantity === 0 ? "filled" : trades.length > 0 ? "partially_filled" : "accepted",
      filledQuantity: order.quantity - remainingQuantity,
      remainingQuantity,
    });

    if (remainingQuantity > 0) {
      const restingOrder: RestingOrder = {
        ...order,
        remainingQuantity,
      };

      this.addToBook(restingOrder);
      executionReports.push({
        orderId: order.id,
        status: "resting",
        filledQuantity: order.quantity - remainingQuantity,
        remainingQuantity,
      });

      return {
        trades,
        executionReports,
        restingOrder,
      };
    }

    return {
      trades,
      executionReports,
    };
  }

  cancelOrder(orderId: string): CancelResult {
    const existingOrder = this.ordersById.get(orderId);

    if (!existingOrder) {
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

    const book = existingOrder.side === "buy" ? this.bids : this.asks;
    const orderIndex = book.findIndex((order) => order.id === orderId);

    if (orderIndex !== -1) {
      book.splice(orderIndex, 1);
    }

    this.ordersById.delete(orderId);

    return {
      found: true,
      executionReport: {
        orderId,
        status: "cancelled",
        filledQuantity: 0,
        remainingQuantity: existingOrder.remainingQuantity,
      },
    };
  }

  getOrderBookSnapshot(symbol: string): OrderBookSnapshot {
    return {
      symbol,
      bids: this.buildLevels(this.bids.filter((order) => order.symbol === symbol)),
      asks: this.buildLevels(this.asks.filter((order) => order.symbol === symbol)),
    };
  }

  private buildLevels(orders: RestingOrder[]): BookLevel[] {
    const levels = new Map<number, { totalQuantity: number; orderCount: number }>();

    for (const order of orders) {
      const current = levels.get(order.price) ?? { totalQuantity: 0, orderCount: 0 };

      current.totalQuantity += order.remainingQuantity;
      current.orderCount += 1;

      levels.set(order.price, current);
    }

    return Array.from(levels.entries()).map(([price, data]) => ({
      price,
      totalQuantity: data.totalQuantity,
      orderCount: data.orderCount,
    }));
  }

  private isPriceMatch(incomingOrder: Order, restingOrder: RestingOrder): boolean {
    if (incomingOrder.symbol !== restingOrder.symbol) {
      return false;
    }

    return incomingOrder.side === "buy"
      ? incomingOrder.price >= restingOrder.price
      : incomingOrder.price <= restingOrder.price;
  }

  private addToBook(order: RestingOrder): void {
    if (order.side === "buy") {
      this.bids.push(order);
      this.sortBook(this.bids, "buy");
    } else {
      this.asks.push(order);
      this.sortBook(this.asks, "sell");
    }

    this.ordersById.set(order.id, order);
  }

  private sortBook(orders: RestingOrder[], side: "buy" | "sell"): void {
    orders.sort((a, b) => {
      if (a.symbol !== b.symbol) {
        return a.symbol.localeCompare(b.symbol);
      }

      if (a.price !== b.price) {
        return side === "buy" ? b.price - a.price : a.price - b.price;
      }

      return a.timestamp - b.timestamp;
    });
  }
}
