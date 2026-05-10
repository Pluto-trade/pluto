import { Router, Request, Response } from "express";
import { prisma, ProtectionReason } from "@repo/database";
import { requireSameUser, requireUserSession } from "../middleware/auth";

const router = Router();

const STALE_REASONS: ProtectionReason[] = [
  ProtectionReason.STRONG_STALE,
  ProtectionReason.DEVIATION,
  ProtectionReason.DEVIATION_HIGH_VOL,
  ProtectionReason.DELAY,
  ProtectionReason.DELAY_HIGH_VOL,
];

function calculateAvoidedNotional(order: { price: unknown; remainingSize: unknown }): number {
  const price = Number(order.price ?? 0);
  const size = Number(order.remainingSize ?? 0);
  if (!Number.isFinite(price) || !Number.isFinite(size)) return 0;
  return price * size;
}

// Fetch total stale-order stats across all users.
router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const decisions = await prisma.protectionDecisions.findMany({
      where: {
        reason: { in: STALE_REASONS },
      },
      include: {
        order: true,
      },
    });

    let totalAvoided = 0;
    for (const decision of decisions) {
      totalAvoided += calculateAvoidedNotional(decision.order);
    }

    res.json({
      staleOrderCount: decisions.length,
      avoidedNotional: totalAvoided,    // amount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch stale-order stats for a specific user.
router.get(
  "/user/:userId",
  requireUserSession,
  requireSameUser((req) =>
    Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
  ),
  async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const decisions = await prisma.protectionDecisions.findMany({
      where: {
        reason: { in: STALE_REASONS },
        order: { userId },
      },
      include: {
        order: true,
      },
    });

    let totalAvoided = 0;
    for (const decision of decisions) {
      totalAvoided += calculateAvoidedNotional(decision.order);
    }

    res.json({
      userId,
      staleOrderCount: decisions.length,
      avoidedNotional: totalAvoided,        // amount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
  },
);

export default router;
