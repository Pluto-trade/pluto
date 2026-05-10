import { Router, Request, Response } from "express";
import { prisma } from "@repo/database";
import { PublicKey } from "@solana/web3.js";
import {
  buildTransaction,
  getConnection,
  getProgram,
  onchainPdas,
  serializeTx,
  SYSTEM_PROGRAM_ID,
} from "../services/onchain";
import { requireSameUser, requireUserSession } from "../middleware/auth";

const router = Router();

// POST /users/sync - Sync user from Privy
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const { email, name, walletAddress, includeOnchain } = req.body as {
      email?: string;
      name?: string;
      walletAddress?: string;
      includeOnchain?: boolean;
    };

    if (!walletAddress) {
      return res.status(400).json({ error: "Missing required field: walletAddress" });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress },
      include: { user: true },
    });

    const normalizedEmail = email ?? `${walletAddress.toLowerCase()}@wallet.plut0x.local`;
    const normalizedName = name ?? `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    const user =
      !email && wallet
        ? wallet.user
        : await prisma.user.upsert({
            where: { email: normalizedEmail },
            update: { name: normalizedName },
            create: { email: normalizedEmail, name: normalizedName },
          });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          address: walletAddress,
          userId: user.id,
        },
        include: { user: true },
      });
    } else if (wallet.userId !== user.id) {
      return res.status(409).json({
        error: `Wallet already linked to ${wallet.user.email}. Log out, switch Phantom wallet, or use that account.`,
      });
    }

    let onchain:
      | {
          createUserTx: string | null;
          userProfile: string;
          alreadyInitialized: boolean;
          skippedReason?: string;
        }
      | undefined;

    if (includeOnchain) {
      try {
        const userPubkey = new PublicKey(walletAddress);
        const userProfile = onchainPdas.userProfile(userPubkey);
        const existingProfile = await getConnection().getAccountInfo(userProfile);

        if (existingProfile) {
          onchain = {
            createUserTx: null,
            userProfile: userProfile.toBase58(),
            alreadyInitialized: true,
          };
        } else {
          const program = getProgram() as any;
          const ix = await program.methods
            .createUser()
            .accounts({
              userProfile,
              user: userPubkey,
              systemProgram: SYSTEM_PROGRAM_ID,
            })
            .instruction();
          const tx = await buildTransaction(ix, userPubkey);

          onchain = {
            createUserTx: serializeTx(tx),
            userProfile: userProfile.toBase58(),
            alreadyInitialized: false,
          };
        }
      } catch (error: any) {
        onchain = {
          createUserTx: null,
          userProfile: "",
          alreadyInitialized: false,
          skippedReason: error.message,
        };
      }
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      wallet: wallet.address,
      onchain,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// GET /users/:userId/profile - Get user profile (name, email, wallets, balances)
router.get(
  "/:userId/profile",
  requireUserSession,
  requireSameUser((req) =>
    Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
  ),
  async (req: Request, res: Response) => {
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
  },
);

// GET /users/:userId/orders - Get all user orders (open or not)
router.get(
  "/:userId/orders",
  requireUserSession,
  requireSameUser((req) =>
    Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
  ),
  async (req: Request, res: Response) => {
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
  },
);

// GET /users/:userId/trades - Get all user trades
router.get(
  "/:userId/trades",
  requireUserSession,
  requireSameUser((req) =>
    Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
  ),
  async (req: Request, res: Response) => {
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
  },
);

// PATCH /users/:userId/name - Update user name only
router.patch(
  "/:userId/name",
  requireUserSession,
  requireSameUser((req) =>
    Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
  ),
  async (req: Request, res: Response) => {
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
  },
);

export default router;
