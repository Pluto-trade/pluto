import { Router, Request, Response } from "express";
import crypto from "crypto";
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from "uuid";
import { orderService } from "../services/order";
import { PlaceOrderRequest } from "../types";
import {
  deleteOrder,
  setOrder,
  updateOrderSize,
} from "../lib/redis/order";
import { addTrade } from "../lib/redis/trades";
import { addOrderEvent } from "../lib/redis/orderEvents";
import { matchingEngineService } from "../services/matchingEngine";
import { balanceService } from "../services/balance";
import { prisma, ProtectionReason } from "@repo/database";
import { marketService } from "../services/market";
import { PublicKey } from "@solana/web3.js";
import {
  assertWalletLinkedToAuthUser,
  requireSameUser,
  requireUserSession,
} from "../middleware/auth";
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

async function resolveOrderPubkey(
  order: { id?: string; userId: string; walletAddress?: string | null },
  explicit?: string | null,
): Promise<PublicKey | null> {
  const walletAddress =
    explicit ??
    order.walletAddress ??
    (order.id ? await orderService.getOrderWalletAddress(order.id) : null);

  return resolveUserPubkey(order.userId, walletAddress);
}

function resolveTokenMint(side: string, baseMint: PublicKey, quoteMint: PublicKey) {
  return side.toUpperCase() === "BUY" ? quoteMint : baseMint;
}

function balanceAssetForSymbol(asset: string) {
  return asset.toUpperCase() === "SOL" ? "wSOL" : asset;
}

function lockedAssetForSide(side: string, market: { baseAsset: string; quoteAsset: string }) {
  return balanceAssetForSymbol(
    side.toUpperCase() === "BUY" ? market.quoteAsset : market.baseAsset,
  );
}

function lockedAmountForOrder(side: string, quantity: number, price?: number | null) {
  if (side.toUpperCase() === "BUY") {
    if (price == null) {
      throw new Error("Cannot reserve quote balance for a buy order without a price.");
    }
    return quantity * price;
  }

  return quantity;
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

async function onchainOrderExists(owner: PublicKey, orderId: string) {
  const account = onchainPdas.order(owner, onchainId(orderId));
  const exists = await getProgram().provider.connection.getAccountInfo(account);
  return !!exists;
}

async function removeOffchainRestingOrder(orderId: string) {
  const order = await orderService.getOrder(orderId);
  matchingEngineService.cancelOrder(orderId);
  await deleteOrder(orderId).catch(() => undefined);

  if (order) {
    const market = await marketService.getMarket(order.marketId);
    if (market) {
      await balanceService.release(
        order.userId,
        lockedAssetForSide(order.side, market),
        lockedAmountForOrder(
          order.side,
          Number(order.remainingSize ?? 0),
          order.price ? Number(order.price) : undefined,
        ),
      );
    }
    await orderService.cancelOrder(orderId).catch(() => undefined);
    await addOrderEvent(order.userId, {
      orderId,
      status: "cancelled",
      remainingSize: 0,
      filledSize: 0,
      marketId: order.marketId,
      side: order.side,
      price: order.price ? Number(order.price) : undefined,
      size: Number(order.size),
      updatedAt: Date.now(),
      message: "Removed because the on-chain order account was missing.",
    } as any);
  }
}

async function purgeMissingOnchainMatches(params: {
  marketId: string;
  side: string;
  type: string;
  price?: number;
  incomingOrderId: string;
  maxRemovals?: number;
}) {
  const removed: string[] = [];
  const maxRemovals = params.maxRemovals ?? 20;

  for (let i = 0; i < maxRemovals; i += 1) {
    const head = await matchingEngineService.peekBestMatch({
      marketId: params.marketId,
      side: params.side,
      type: params.type,
      price: params.price,
    });

    if (!head || head.id === params.incomingOrderId) break;

    const dbOrder = await orderService.getOrder(head.id);
    const owner = dbOrder
      ? await resolveOrderPubkey(dbOrder)
      : await resolveUserPubkey(head.userId, undefined);
    if (owner && (await onchainOrderExists(owner, head.id))) break;

    removed.push(head.id);
    await removeOffchainRestingOrder(head.id);
  }

  return removed;
}

async function assertOnchainAvailableBalance(params: {
  userPubkey: PublicKey;
  tokenMint: PublicKey;
  asset: string;
  requiredRaw: string;
  decimals: number;
}) {
  const program = getProgram() as any;
  const account = await program.account.userBalance.fetchNullable(
    onchainPdas.userBalance(params.userPubkey, params.tokenMint),
  );

  if (!account) {
    throw new Error(
      `On-chain ${params.asset} balance account was not found. Deposit ${params.asset} into the exchange first.`,
    );
  }

  const availableRaw = BigInt(account.availableAmount.toString());
  const requiredRaw = BigInt(params.requiredRaw);
  if (availableRaw >= requiredRaw) return;

  const scale = 10 ** params.decimals;
  const available = Number(availableRaw) / scale;
  const required = Number(requiredRaw) / scale;
  throw new Error(
    `Insufficient on-chain ${params.asset} balance. Available: ${available}, required: ${required}. Deposit more ${params.asset} into the exchange or cancel open orders to unlock funds.`,
  );
}

function mapProtectionReason(message: string): ProtectionReason | null {
  if (message.includes("STRONG_STALE")) return ProtectionReason.STRONG_STALE;
  if (message.includes("DEVIATION [HIGH_VOL]")) return ProtectionReason.DEVIATION_HIGH_VOL;
  if (message.includes("DEVIATION")) return ProtectionReason.DEVIATION;
  if (message.includes("DELAY [HIGH_VOL]")) return ProtectionReason.DELAY_HIGH_VOL;
  if (message.includes("DELAY")) return ProtectionReason.DELAY;
  return null;
}

function explainProtectionReason(reason: ProtectionReason | null, message: string) {
  if (reason === ProtectionReason.STRONG_STALE) {
    return "stale quote/order protection";
  }
  if (reason === ProtectionReason.DELAY || reason === ProtectionReason.DELAY_HIGH_VOL) {
    return "delay protection";
  }
  if (reason === ProtectionReason.DEVIATION || reason === ProtectionReason.DEVIATION_HIGH_VOL) {
    return "price deviation protection";
  }
  return message.replace(/^MPE:\s*/, "") || "market protection";
}

function mapEngineStatusToDbStatus(status: string) {
  switch (status) {
    case "resting":
      return "OPEN";
    case "partially_filled":
      return "PARTIALLY_FILLED";
    case "filled":
      return "FILLED";
    case "cancelled":
      return "CANCELLED";
    case "accepted":
      return "ACCEPTED";
    default:
      return "ACCEPTED";
  }
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
router.post(
  "/",
  requireUserSession,
  requireSameUser((req) => req.body?.userId),
  async (req: Request, res: Response) => {
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

    const onchainBaseMint = onchain?.baseMint ?? (req.body as any).baseMint;
    const onchainQuoteMint = onchain?.quoteMint ?? (req.body as any).quoteMint;
    const onchainUserPubkey = onchain?.userPubkey ?? (req.body as any).userPubkey;
    const incomingLockedAsset = lockedAssetForSide(cleanSide, market);
    const incomingLockedAmount = lockedAmountForOrder(cleanSide, size, price);
    const incomingBalance = await balanceService.getBalance(userId, incomingLockedAsset);
    if (!incomingBalance || incomingBalance.available.lessThan(incomingLockedAmount)) {
      const available = incomingBalance ? incomingBalance.available.toNumber() : 0;
      return res.status(400).json({
        error: `Insufficient ${incomingLockedAsset} balance. Available: ${available}, required: ${incomingLockedAmount}.`,
      });
    }

    if (onchainBaseMint && onchainQuoteMint && onchainUserPubkey) {
      try {
        await assertWalletLinkedToAuthUser(userId, onchainUserPubkey);
        const userPubkey = new PublicKey(onchainUserPubkey);
        const baseMint = new PublicKey(onchainBaseMint);
        const quoteMint = new PublicKey(onchainQuoteMint);
        const tokenMint = resolveTokenMint(cleanSide, baseMint, quoteMint);
        const requiredRaw =
          cleanSide === "BUY"
            ? toQuoteRawAmount(incomingLockedAmount)
            : toBaseRawAmount(incomingLockedAmount);

        await assertOnchainAvailableBalance({
          userPubkey,
          tokenMint,
          asset: incomingLockedAsset,
          requiredRaw,
          decimals: cleanSide === "BUY" ? 6 : 9,
        });
      } catch (error: any) {
        return res.status(400).json({
          error: error.message ?? "On-chain balance check failed.",
        });
      }
    }

    // Create order in database
    const orderId = uuidv4().replace(/-/g, "");
    const removedMissingOnchainOrders =
      onchainBaseMint && onchainQuoteMint
        ? await purgeMissingOnchainMatches({
            marketId,
            side: cleanSide,
            type: cleanType,
            price,
            incomingOrderId: orderId,
          })
        : [];
    let reservedIncomingAmount = 0;
    const dbOrder = await orderService.createOrder(
      userId,
      marketId,
      side,
      type,
      size,
      price,
      orderId,
      onchainUserPubkey,
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

    console.log(result);

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
      await orderService.recordTrade(
        trade.makerOrderId,
        trade.takerOrderId,
        marketId,
        trade.price,
        trade.quantity,
      );
    }

    const latestReportsByOrder = new Map<string, (typeof result.executionReports)[number]>();
    for (const report of result.executionReports) {
      latestReportsByOrder.set(report.orderId, report);
    }

    for (const report of latestReportsByOrder.values()) {
      await orderService.updateOrderExecution(
        report.orderId,
        mapEngineStatusToDbStatus(report.status),
        report.remainingQuantity,
      );
    }

    for (const report of makerReports) {
      const makerOrder = await orderService.getOrder(report.orderId);
      const makerMarket = makerOrder
        ? await marketService.getMarket(makerOrder.marketId)
        : null;
      const makerAsset =
        makerOrder && makerMarket ? lockedAssetForSide(makerOrder.side, makerMarket) : null;
      const makerPrice = makerOrder?.price ? Number(makerOrder.price) : undefined;

      if (makerOrder && makerAsset && report.filledQuantity > 0) {
        await balanceService.consumeReserved(
          makerOrder.userId,
          makerAsset,
          lockedAmountForOrder(makerOrder.side, report.filledQuantity, makerPrice),
        );
      }

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
        if (makerOrder && makerAsset) {
          await balanceService.release(
            makerOrder.userId,
            makerAsset,
            lockedAmountForOrder(makerOrder.side, report.remainingQuantity, makerPrice),
          );
        }
        await deleteOrder(report.orderId);
      }
    }

    const mpeReports = result.executionReports.filter(
      (report) => report.message && report.message.startsWith("MPE:"),
    );
    const protectionReports = mpeReports.map((report) => {
      const reason = mapProtectionReason(report.message ?? "");
      return {
        orderId: report.orderId,
        action: "cancelled",
        reason,
        message: report.message,
        displayMessage: explainProtectionReason(reason, report.message ?? ""),
        quoteAgeMs:
          report.mpe?.quoteAgeMs != null ? Math.round(report.mpe.quoteAgeMs) : null,
        quotePrice: report.mpe?.quotePrice ?? null,
        priceDeviation: report.mpe?.priceDeviation ?? null,
      };
    });

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
    console.log(orderbookSnapshot)
    const timestamp = Date.now();

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

              const buyerPubkey = await resolveOrderPubkey(buyOrder);
              const sellerPubkey = await resolveOrderPubkey(sellOrder);
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

              const makerPubkey = await resolveOrderPubkey(makerOrder);
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

    if (result.restingOrder) {
      reservedIncomingAmount = lockedAmountForOrder(
        cleanSide,
        result.restingOrder.remainingQuantity,
        result.restingOrder.price,
      );
      await balanceService.reserve(userId, incomingLockedAsset, reservedIncomingAmount);
    }

    res.status(201).json({
      orderId,
      ...dbOrder,
      orderBookResult: result,
      removedMissingOnchainOrders,
      protectionReports,
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
  },
);

// GET /orders/:orderId - Get order details
router.get("/:orderId", requireUserSession, async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.userId !== req.authUserId) {
      return res.status(403).json({ error: "Cannot access another user's order" });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /orders/:orderId - Cancel order
router.delete("/:orderId", requireUserSession, async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.userId !== req.authUserId) {
      return res.status(403).json({ error: "Cannot cancel another user's order" });
    }

    // Cancel in the same matching-engine book used by order placement.
    matchingEngineService.cancelOrder(orderId);
    await deleteOrder(orderId);

    const market = await marketService.getMarket(order.marketId);
    if (market) {
      await balanceService.release(
        order.userId,
        lockedAssetForSide(order.side, market),
        lockedAmountForOrder(
          order.side,
          Number(order.remainingSize ?? 0),
          order.price ? Number(order.price) : undefined,
        ),
      );
    }

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
        const userPubkey = await resolveOrderPubkey(order, userPubkeyInput);
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
router.patch("/:orderId", requireUserSession, async (req: Request, res: Response) => {
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
    if (order.userId !== req.authUserId) {
      return res.status(403).json({ error: "Cannot modify another user's order" });
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
router.get(
  "/user/:userId/all",
  requireUserSession,
  requireSameUser((req) =>
    Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
  ),
  async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const orders = await orderService.getUserOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
  },
);

// GET /users/:userId/orders/open - Get user's open orders
router.get(
  "/user/:userId/open",
  requireUserSession,
  requireSameUser((req) =>
    Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
  ),
  async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const orders = await orderService.getUserOpenOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
  },
);

export default router;
