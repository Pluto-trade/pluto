import type { NextFunction, Request, Response } from "express";
import { prisma } from "@repo/database";

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authWalletAddress?: string;
    }
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function requireUserSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = headerValue(req.headers["x-user-id"]);
  const walletAddress = headerValue(req.headers["x-wallet-address"]);

  if (!userId && !walletAddress) {
    return res.status(401).json({ error: "Login required" });
  }

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        include: { wallets: true },
      })
    : walletAddress
      ? await prisma.user.findFirst({
          where: { wallets: { some: { address: walletAddress } } },
          include: { wallets: true },
        })
      : null;

  if (!user) {
    return res.status(401).json({ error: "Invalid user session" });
  }

  if (
    walletAddress &&
    !user.wallets.some((wallet) => wallet.address === walletAddress)
  ) {
    return res.status(403).json({ error: "Wallet is not linked to this user" });
  }

  req.authUserId = user.id;
  req.authWalletAddress = walletAddress;
  next();
}

export function requireSameUser(resolveUserId: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const targetUserId = resolveUserId(req);
    if (!targetUserId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (req.authUserId !== targetUserId) {
      return res.status(403).json({ error: "Cannot access another user's resource" });
    }

    next();
  };
}

export async function assertWalletLinkedToAuthUser(
  userId: string,
  walletAddress?: string | null,
) {
  if (!walletAddress) return;

  const wallet = await prisma.wallet.findUnique({
    where: { address: walletAddress },
  });

  if (!wallet || wallet.userId !== userId) {
    throw new Error("Wallet is not linked to this user");
  }
}
