import { Router, Request, Response } from "express";
import { prisma } from "@repo/database";

const router = Router();

// GET /users/:userId/profile - Get user profile (name, email, wallets, balances)
router.get("/:userId/profile", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        balances: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      wallets: user.wallets,
      balances: user.balances,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users/:userId/orders - Get all user orders (open or not)
router.get("/:userId/orders", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users/:userId/trades - Get all user trades
router.get("/:userId/trades", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { makerOrder: { userId } },
          { takerOrder: { userId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        makerOrder: { select: { id: true, userId: true } },
        takerOrder: { select: { id: true, userId: true } },
        market: { select: { id: true, symbol: true } },
      },
    });

    const formatted = trades.map((trade) => {
      const roles: Array<"MAKER" | "TAKER"> = [];
      if (trade.makerOrder.userId === userId) roles.push("MAKER");
      if (trade.takerOrder.userId === userId) roles.push("TAKER");

      return {
        id: trade.id,
        price: trade.price,
        size: trade.size,
        marketId: trade.marketId,
        marketSymbol: trade.market.symbol,
        makerOrderId: trade.makerOrderId,
        takerOrderId: trade.takerOrderId,
        roles,
        createdAt: trade.createdAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /users/:userId/name - Update user name only
router.patch("/:userId/name", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const { name } = req.body as { name?: string };

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
