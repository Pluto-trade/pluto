import { Router, Request, Response } from "express";
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from "uuid";
import { orderService } from "../services/order";
import { PlaceOrderRequest } from "../types";
import { deleteOrder, setOrder, updateOrderSize } from "../lib/redis/order";
import { addTrade } from "../lib/redis/trades";
import { addOrderEvent } from "../lib/redis/orderEvents";
import { matchingEngineService } from "../services/matchingEngine";

const router = Router();

// POST /orders - Place an order
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, marketId, side, size, price, type } =
      req.body as PlaceOrderRequest;

    if (!userId || !marketId || !side || !size || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cleanType = type.toUpperCase();
    const cleanSide = side.toUpperCase() as "BUY" | "SELL";

    if (cleanType === "LIMIT" && price === undefined) {
      return res.status(400).json({ error: "Price required for limit orders" });
    }

    // Create order in database
    const orderId = uuidv4();
    const dbOrder = await orderService.createOrder(
      userId,
      marketId,
      side,
      type,
      size,
      price,
      orderId,
    );

    const result = await matchingEngineService.addOrder(
      { 
        orderId, 
        userId, 
        marketId, 
        side, 
        type, 
        size, 
        price,
      }
    );

    // console.log(result);

    // Persist only the actual resting quantity. A crossing limit can fill
    // completely, in which case it should not be added as an open book entry.
    if (cleanType === "LIMIT" && result.restingOrder) {
      await setOrder(
        orderId,
        userId,
        marketId,
        cleanSide,
        result.restingOrder.remainingQuantity.toString(),
        result.restingOrder.price.toString(),
        dbOrder.createdAt.toString(),
      );
    }

    // Apply incremental updates for maker orders filled during matching.
    const makerReports = result.executionReports.filter(
      (report) => report.orderId !== orderId,
    );

    for (const trade of result.trades) {
      await addTrade(marketId, {
        price: trade.price,
        size: trade.quantity,
        buyOrderId: trade.buyOrderId,
        sellOrderId: trade.sellOrderId,
        timestamp: trade.timestamp,
      });
    }

    for (const report of makerReports) {
      if (report.status === "filled") {
        await deleteOrder(report.orderId);
        continue;
      }

      if (report.status === "partially_filled") {
        await updateOrderSize(
          report.orderId,
          report.remainingQuantity.toString(),
        );
        continue;
      }

      if (report.status === "cancelled") {
        await deleteOrder(report.orderId);
      }
    }

    const now = Date.now();
    await addOrderEvent(userId, {
      orderId,
      status: result.orderStatus,
      remainingSize: result.remainingQuantity,
      filledSize: size - result.remainingQuantity,
      marketId,
      side,
      price,
      size,
      updatedAt: now,
    });

    const orderbookSnapshot = await matchingEngineService.getSnapshot(marketId);
    // console.log(orderbookSnapshot)
    const timestamp = Date.now();

    res.status(201).json({
      orderId,
      ...dbOrder,
      orderBookResult: result,
      orderbookSnapshot: {
        bids: orderbookSnapshot.bids.map((level) => ({
          price: level.price,
          size: level.totalQuantity,
          timestamp,
        })),
        asks: orderbookSnapshot.asks.map((level) => ({
          price: level.price,
          size: level.totalQuantity,
          timestamp,
        })),
        timestamp,
      },
    });
  } catch (error: any) {
    // console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /orders/:orderId - Get order details
router.get("/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /orders/:orderId - Cancel order
router.delete("/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Cancel in the same matching-engine book used by order placement.
    matchingEngineService.cancelOrder(orderId);
    await deleteOrder(orderId);

    // Update in database
    const cancelled = await orderService.cancelOrder(orderId);
    await addOrderEvent(order.userId, {
      orderId,
      status: "cancelled",
      remainingSize: Number(order.remainingSize ?? 0),
      filledSize: 0,
      marketId: order.marketId,
      side: order.side,
      price: order.price ? Number(order.price) : undefined,
      size: Number(order.size),
      updatedAt: Date.now(),
    });
    res.json(cancelled);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /orders/:orderId - Modify order
router.patch("/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    const { size, price } = req.body;

    if (!size || !price) {
      return res.status(400).json({ error: "Size and price required" });
    }

    const order = await orderService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Note: Order modification in the orderbook is not supported in @repo/orderbook
    // The order would need to be cancelled and re-placed
    // For now, only update the database
    // orderbookService.modifyOrder(order.marketId, orderId, size, price);

    // Update in database
    const updated = await orderService.updateOrderRemainingSize(orderId, size);
    await addOrderEvent(order.userId, {
      orderId,
      status: "updated",
      remainingSize: size,
      filledSize: 0,
      marketId: order.marketId,
      side: order.side,
      price: order.price ? Number(order.price) : undefined,
      size: Number(order.size),
      updatedAt: Date.now(),
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users/:userId/orders - Get user's orders
router.get("/user/:userId/all", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const orders = await orderService.getUserOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users/:userId/orders/open - Get user's open orders
router.get("/user/:userId/open", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const orders = await orderService.getUserOpenOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
