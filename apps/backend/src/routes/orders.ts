import { Router, Request, Response } from "express";
import crypto from "crypto";
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from "uuid";
import { orderService } from "../services/order";
import { PlaceOrderRequest } from "../types";
import { deleteOrder, setOrder, updateOrderSize } from "../lib/redis/order";
import { addTrade } from "../lib/redis/trades";
import { addOrderEvent } from "../lib/redis/orderEvents";
import { matchingEngineService } from "../services/matchingEngine";
import { prisma, ProtectionReason } from "@repo/database";
import { marketService } from "../services/market";
import { PublicKey } from "@solana/web3.js";
import {
  buildTransaction,
  getAuthorityKeypair,
  getProgram,
  onchainPdas,
  serializeTx,
  sendSignedTx,
  toBn,
  toBaseRawAmount,
  toQuoteRawAmount,
  SYSTEM_PROGRAM_ID,
} from "../services/onchain";


const router = Router();

function mapOrderSide(side: string) {
  const normalized = side.toUpperCase();
  if (normalized === "BUY") return { buy: {} };
  if (normalized === "SELL") return { sell: {} };
  throw new Error("Invalid side. Use BUY or SELL.");
}

function mapOrderType(orderType: string) {
  const normalized = orderType.toUpperCase();
  if (normalized === "LIMIT") return { limit: {} };
  if (normalized === "MARKET") return { market: {} };
  throw new Error("Invalid orderType. Use LIMIT or MARKET.");
}

function onchainId(value: string): string {
  return value.length <= 32
    ? value
    : crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);
}

async function resolveUserPubkey(
  userId: string,
  explicit?: string | null,
): Promise<PublicKey | null> {
  if (explicit) {
    return new PublicKey(explicit);
  }

  const wallet = await prisma.wallet.findFirst({ where: { userId } });
  if (!wallet) return null;
  return new PublicKey(wallet.address);
}

function resolveTokenMint(side: string, baseMint: PublicKey, quoteMint: PublicKey) {
  return side.toUpperCase() === "BUY" ? quoteMint : baseMint;
}

async function assertOnchainOrderExists(
  owner: PublicKey,
  orderId: string,
  incomingOrderId: string,
) {
  if (orderId === incomingOrderId) return;

  const account = onchainPdas.order(owner, onchainId(orderId));
  const exists = await getProgram().provider.connection.getAccountInfo(account);
  if (!exists) {
    throw new Error(
      `Matched resting order ${orderId} is not on-chain. Removed stale order; please submit again.`,
    );
  }
}

function mapProtectionReason(message: string): ProtectionReason | null {
  if (message.includes("STRONG_STALE")) return ProtectionReason.STRONG_STALE;
  if (message.includes("DEVIATION [HIGH_VOL]")) return ProtectionReason.DEVIATION_HIGH_VOL;
  if (message.includes("DEVIATION")) return ProtectionReason.DEVIATION;
  if (message.includes("DELAY [HIGH_VOL]")) return ProtectionReason.DELAY_HIGH_VOL;
  if (message.includes("DELAY")) return ProtectionReason.DELAY;
  return null;
}

function getOnchainOrderPrice(
  orderType: string,
  side: string,
  price: number | undefined,
  trades: Array<{ price: number }>,
): number | null {
  if (price != null) {
    if (
      side.toUpperCase() === "BUY" &&
      trades.length > 0 &&
      trades.some((trade) => trade.price !== price)
    ) {
      return null;
    }

    return price;
  }

  if (orderType.toUpperCase() !== "MARKET" || trades.length === 0) {
    return null;
  }

  // The current Anchor instruction still requires a non-zero price for market
  // orders. A single-fill market order can safely use the execution price.
  // Multi-fill market buys can over-lock quote if we guess, so skip them.
  if (side.toUpperCase() === "BUY" && trades.length > 1) {
    return null;
  }

  return trades[0]?.price ?? null;
}

// POST /orders - Place an order
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, marketId, side, size, price, type, onchain } =
      req.body as PlaceOrderRequest;

    if (!userId || !marketId || !side || !size || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cleanType = type.toUpperCase();
    const cleanSide = side.toUpperCase() as "BUY" | "SELL";

    if (cleanType === "LIMIT" && price === undefined) {
      return res.status(400).json({ error: "Price required for limit orders" });
    }

    const market = await marketService.getMarket(marketId);
    if (!market) {
      return res.status(404).json({ error: "Market not found" });
    }

    // Create order in database
    const orderId = uuidv4().replace(/-/g, "");
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

    const mpeReports = result.executionReports.filter(
      (report) => report.message && report.message.startsWith("MPE:"),
    );

    for (const report of mpeReports) {
      const reason = mapProtectionReason(report.message ?? "");
      if (!reason) continue;
      await prisma.protectionDecisions.create({
        data: {
          takerOrderId: orderId,
          decision: "CANCEL",
          reason,
          orderId: report.orderId,
          marketId,
          priceDeviation: report.mpe?.priceDeviation ?? null,
          quotePrice: report.mpe?.quotePrice ?? null,
          quoteAgeMs:
            report.mpe?.quoteAgeMs != null
              ? Math.round(report.mpe.quoteAgeMs)
              : null,
        },
      });
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

    const onchainBaseMint = onchain?.baseMint ?? (req.body as any).baseMint;
    const onchainQuoteMint = onchain?.quoteMint ?? (req.body as any).quoteMint;
    const onchainUserPubkey = onchain?.userPubkey ?? (req.body as any).userPubkey;

    let placeOrderTx: string | null = null;
    let settlementTxs: Array<{ tradeId: string; transaction: string }> = [];
    let cancelOrderTxs: Array<{ orderId: string; transaction: string }> = [];
    let cancelOrderSignatures: Array<{ orderId: string; signature: string }> = [];
    let settlementSkipped: string[] = [];
    const onchainWarnings: string[] = [];
    const shouldBuildOnchain = result.orderStatus !== "rejected";
    const shouldPlaceOnchain =
      shouldBuildOnchain && (result.trades.length > 0 || !!result.restingOrder);

    if (onchainBaseMint && onchainQuoteMint && shouldBuildOnchain) {
      try {
        const baseMint = new PublicKey(onchainBaseMint);
        const quoteMint = new PublicKey(onchainQuoteMint);
        const program = getProgram() as any;
        const authority = getAuthorityKeypair();
        const userPubkey = await resolveUserPubkey(userId, onchainUserPubkey);

        if (!userPubkey) {
          onchainWarnings.push("No wallet found for incoming order user.");
        }

        const onchainOrderPrice = getOnchainOrderPrice(
          cleanType,
          cleanSide,
          price,
          result.trades,
        );

        if (shouldPlaceOnchain && userPubkey && onchainOrderPrice != null) {
          const tokenMint = resolveTokenMint(cleanSide, baseMint, quoteMint);

          const placeOrderIx = await program.methods
            .placeOrder({
              orderId,
              symbol: market.symbol,
              side: mapOrderSide(cleanSide),
              orderType: mapOrderType(cleanType),
              price: toBn(toQuoteRawAmount(onchainOrderPrice)),
              quantity: toBn(toBaseRawAmount(size)),
            })
            .accounts({
              exchange: onchainPdas.exchange(),
              userProfile: onchainPdas.userProfile(userPubkey),
              order: onchainPdas.order(userPubkey, orderId),
              escrow: onchainPdas.escrow(userPubkey, orderId),
              userBalance: onchainPdas.userBalance(userPubkey, tokenMint),
              custodyVault: onchainPdas.custodyVault(tokenMint),
              tokenMint,
              user: userPubkey,
              systemProgram: SYSTEM_PROGRAM_ID,
            })
            .instruction();

          const settlementIxs = await Promise.all(
            result.trades.map(async (trade) => {
              const buyOrder = await orderService.getOrder(trade.buyOrderId);
              const sellOrder = await orderService.getOrder(trade.sellOrderId);
              if (!buyOrder || !sellOrder) {
                settlementSkipped.push(trade.tradeId);
                return null;
              }

              const buyerPubkey = await resolveUserPubkey(
                buyOrder.userId,
                undefined,
              );
              const sellerPubkey = await resolveUserPubkey(
                sellOrder.userId,
                undefined,
              );
              if (!buyerPubkey || !sellerPubkey) {
                settlementSkipped.push(trade.tradeId);
                return null;
              }

              await assertOnchainOrderExists(
                buyerPubkey,
                trade.buyOrderId,
                orderId,
              );
              await assertOnchainOrderExists(
                sellerPubkey,
                trade.sellOrderId,
                orderId,
              );

              const ix = await program.methods
                .settleTrade({
                  tradeId: onchainId(trade.tradeId),
                  symbol: trade.symbol,
                  price: toBn(toQuoteRawAmount(trade.price)),
                  quantity: toBn(toBaseRawAmount(trade.quantity)),
                })
                .accounts({
                  exchange: onchainPdas.exchange(),
                  authority: authority.publicKey,
                  buyerOrder: onchainPdas.order(buyerPubkey, onchainId(trade.buyOrderId)),
                  buyerEscrow: onchainPdas.escrow(buyerPubkey, onchainId(trade.buyOrderId)),
                  buyerBalance: onchainPdas.userBalance(buyerPubkey, quoteMint),
                  buyerReceivedBalance: onchainPdas.userBalance(buyerPubkey, baseMint),
                  seller: sellerPubkey,
                  sellerOrder: onchainPdas.order(sellerPubkey, onchainId(trade.sellOrderId)),
                  sellerEscrow: onchainPdas.escrow(sellerPubkey, onchainId(trade.sellOrderId)),
                  sellerBalance: onchainPdas.userBalance(sellerPubkey, baseMint),
                  sellerReceivedBalance: onchainPdas.userBalance(sellerPubkey, quoteMint),
                  baseMint,
                  quoteMint,
                  baseCustody: onchainPdas.custodyVault(baseMint),
                  quoteCustody: onchainPdas.custodyVault(quoteMint),
                  tradeSettlement: onchainPdas.settlement(onchainId(trade.tradeId)),
                  buyer: buyerPubkey,
                  systemProgram: SYSTEM_PROGRAM_ID,
                })
                .instruction();

              return { tradeId: trade.tradeId, ix };
            }),
          );

          const validSettlementIxs = settlementIxs.filter(
            (item): item is { tradeId: string; ix: any } => !!item,
          );

          settlementTxs = validSettlementIxs
            .map((item) => ({ tradeId: item.tradeId, transaction: "combined-with-place-order" }));

          const tx = await buildTransaction(
            [placeOrderIx, ...validSettlementIxs.map((item) => item.ix)],
            userPubkey,
          );
          if (validSettlementIxs.length > 0) {
            tx.partialSign(authority);
          }
          placeOrderTx = serializeTx(tx);
        } else if (shouldPlaceOnchain && onchainOrderPrice == null) {
          onchainWarnings.push(
            "Skipped place_order because the current program requires a non-zero price and this order had no safe on-chain price.",
          );
        }

        if (mpeReports.length > 0) {
          const cancelTxs = await Promise.all(
            mpeReports.map(async (report) => {
              const makerOrder = await orderService.getOrder(report.orderId);
              if (!makerOrder) return null;

              const makerPubkey = await resolveUserPubkey(
                makerOrder.userId,
                undefined,
              );
              if (!makerPubkey) return null;

              const tokenMint = resolveTokenMint(
                makerOrder.side,
                baseMint,
                quoteMint,
              );

              const ix = await program.methods
                .cancelOrder()
                .accounts({
                  exchange: onchainPdas.exchange(),
                  authority: authority.publicKey,
                  userProfile: onchainPdas.userProfile(makerPubkey),
                  order: onchainPdas.order(makerPubkey, onchainId(makerOrder.id)),
                  escrow: onchainPdas.escrow(makerPubkey, onchainId(makerOrder.id)),
                  userBalance: onchainPdas.userBalance(makerPubkey, tokenMint),
                  custodyVault: onchainPdas.custodyVault(tokenMint),
                  user: makerPubkey,
                })
                .instruction();

              const tx = await buildTransaction(ix, authority.publicKey);
              const signature = await sendSignedTx(tx, [authority]);
              return { orderId: makerOrder.id, signature };
            }),
          );

          cancelOrderSignatures = cancelTxs.filter(
            (tx): tx is { orderId: string; signature: string } => !!tx,
          );
        }
      } catch (err: any) {
        console.warn("Failed to build on-chain transactions:", err);
        if (shouldPlaceOnchain) {
          for (const trade of result.trades) {
            for (const staleOrderId of [trade.buyOrderId, trade.sellOrderId]) {
              if (staleOrderId === orderId) continue;
              matchingEngineService.cancelOrder(staleOrderId);
              await deleteOrder(staleOrderId);
              await orderService.cancelOrder(staleOrderId).catch(() => undefined);
            }
          }

          if (result.restingOrder) {
            matchingEngineService.cancelOrder(orderId);
            await deleteOrder(orderId);
          }

          await orderService.cancelOrder(orderId);
          await addOrderEvent(userId, {
            orderId,
            status: "rejected",
            remainingSize: 0,
            filledSize: 0,
            marketId,
            side,
            price,
            size,
            updatedAt: Date.now(),
          });

          return res.status(500).json({
            error: `Failed to build on-chain transaction: ${err?.message ?? "unknown error"}`,
          });
        }
      }
    } else if (result.orderStatus === "rejected") {
      onchainWarnings.push("Order was rejected by preprocessing/MPE; no on-chain order transaction was built.");
    } else if (!onchainBaseMint || !onchainQuoteMint) {
      onchainWarnings.push(
        "Skipped on-chain transaction building because baseMint and quoteMint were not provided.",
      );
    }

    if (shouldPlaceOnchain && !placeOrderTx) {
      if (result.restingOrder) {
        matchingEngineService.cancelOrder(orderId);
        await deleteOrder(orderId);
      }

      await orderService.cancelOrder(orderId);
      await addOrderEvent(userId, {
        orderId,
        status: "rejected",
        remainingSize: 0,
        filledSize: 0,
        marketId,
        side,
        price,
        size,
        updatedAt: Date.now(),
      });

      return res.status(500).json({
        error: onchainWarnings[0] ?? "On-chain order transaction was not built.",
      });
    }

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
      onchain: {
        placeOrderTx,
        settlementTxs,
        settlementSkipped,
        cancelOrderTxs,
        cancelOrderSignatures,
        warnings: onchainWarnings,
        sequence:
          placeOrderTx ||
          settlementTxs.length > 0 ||
          cancelOrderTxs.length > 0 ||
          cancelOrderSignatures.length > 0
            ? ["cancel_order for MPE removals", "place_order for accepted/resting/traded incoming order", "settle_trade for fills"].filter(
                (step) =>
                  (step.startsWith("cancel") &&
                    (cancelOrderTxs.length > 0 || cancelOrderSignatures.length > 0)) ||
                  (step.startsWith("place") && !!placeOrderTx) ||
                  (step.startsWith("settle") && settlementTxs.length > 0),
              )
            : [],
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
    const baseMintInput =
      (req.body && (req.body as any).baseMint) ||
      (req.query && (req.query as any).baseMint);
    const quoteMintInput =
      (req.body && (req.body as any).quoteMint) ||
      (req.query && (req.query as any).quoteMint);
    const userPubkeyInput =
      (req.body && (req.body as any).userPubkey) ||
      (req.query && (req.query as any).userPubkey);

    let cancelOrderTx: string | null = null;
    let cancelOrderSignature: string | null = null;

    if (baseMintInput && quoteMintInput) {
      try {
        const userPubkey = await resolveUserPubkey(order.userId, userPubkeyInput);
        if (userPubkey) {
          const baseMint = new PublicKey(baseMintInput);
          const quoteMint = new PublicKey(quoteMintInput);
          const tokenMint = resolveTokenMint(order.side, baseMint, quoteMint);
          const program = getProgram() as any;
          const authority = getAuthorityKeypair();

          const ix = await program.methods
            .cancelOrder()
            .accounts({
              exchange: onchainPdas.exchange(),
              authority: authority.publicKey,
              userProfile: onchainPdas.userProfile(userPubkey),
              order: onchainPdas.order(userPubkey, orderId),
              escrow: onchainPdas.escrow(userPubkey, orderId),
              userBalance: onchainPdas.userBalance(userPubkey, tokenMint),
              custodyVault: onchainPdas.custodyVault(tokenMint),
              user: userPubkey,
            })
            .instruction();

          const tx = await buildTransaction(ix, authority.publicKey);
          cancelOrderSignature = await sendSignedTx(tx, [authority]);
        }
      } catch (err) {
        console.warn("Failed to build cancelOrder tx:", err);
      }
    }

    res.json({
      ...cancelled,
      onchain: { cancelOrderTx, cancelOrderSignature },
    });
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
