import { Router, Request, Response } from "express";
import crypto from "crypto";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  buildTransaction,
  getAuthorityKeypair,
  getConnection,
  getProgram,
  onchainPdas,
  serializeTx,
  sendSignedTx,
  toBn,
  toBaseRawAmount,
  toQuoteRawAmount,
  toRawAmount,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "../services/onchain";

const router = Router();

function onchainId(value: string): string {
  return value.length <= 32
    ? value
    : crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function mintDecimals(mint: PublicKey): number {
  const baseMint = new PublicKey(
    process.env.BASE_MINT ?? "So11111111111111111111111111111111111111112",
  );
  return mint.equals(baseMint) ? 9 : 6;
}

function parsePubkey(value: string, label: string): PublicKey {
  try {
    return new PublicKey(value);
  } catch (err) {
    throw new Error(`Invalid ${label} public key`);
  }
}

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

router.get("/pdas", (req: Request, res: Response) => {
  try {
    const user = req.query.user ? parsePubkey(String(req.query.user), "user") : null;
    const mint = req.query.mint ? parsePubkey(String(req.query.mint), "mint") : null;
    const orderId = req.query.orderId ? String(req.query.orderId) : null;
    const tradeId = req.query.tradeId ? String(req.query.tradeId) : null;

    res.json({
      exchange: onchainPdas.exchange().toBase58(),
      userProfile: user ? onchainPdas.userProfile(user).toBase58() : null,
      custodyVault: mint ? onchainPdas.custodyVault(mint).toBase58() : null,
      userBalance:
        user && mint ? onchainPdas.userBalance(user, mint).toBase58() : null,
      order: user && orderId ? onchainPdas.order(user, orderId).toBase58() : null,
      escrow: user && orderId ? onchainPdas.escrow(user, orderId).toBase58() : null,
      settlement: tradeId ? onchainPdas.settlement(onchainId(tradeId)).toBase58() : null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/custody/:tokenMint", async (req: Request, res: Response) => {
  try {
    const tokenMint = Array.isArray(req.params.tokenMint)
      ? req.params.tokenMint[0]
      : req.params.tokenMint;
    const mint = parsePubkey(tokenMint, "tokenMint");
    const program = getProgram() as any;
    const custodyVault = onchainPdas.custodyVault(mint);
    const custody = await program.account.custodyVault.fetch(custodyVault);

    res.json({
      custodyVault: custodyVault.toBase58(),
      tokenMint: custody.tokenMint.toBase58(),
      tokenVault: custody.tokenVault.toBase58(),
      totalDeposited: custody.totalDeposited.toString(),
      totalWithdrawn: custody.totalWithdrawn.toString(),
      totalLocked: custody.totalLocked.toString(),
      totalFeesCollected: custody.totalFeesCollected.toString(),
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/initialize", async (req: Request, res: Response) => {
  try {
    const { feeBps } = req.body as { feeBps: number };
    if (feeBps == null) {
      return res.status(400).json({ error: "feeBps required" });
    }

    const program = getProgram() as any;
    const authority = getAuthorityKeypair();
    const exchange = onchainPdas.exchange();
    const existingExchange = await getConnection().getAccountInfo(exchange);
    if (existingExchange) {
      return res.json({
        signature: null,
        exchange: exchange.toBase58(),
        alreadyInitialized: true,
      });
    }

    const ix = await program.methods
      .initialize(feeBps)
      .accounts({
        config: exchange,
        authority: authority.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .instruction();

    const tx = await buildTransaction(ix, authority.publicKey);
    const sig = await sendSignedTx(tx, [authority]);

    res.json({ signature: sig, exchange: exchange.toBase58(), alreadyInitialized: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/custody/initialize", async (req: Request, res: Response) => {
  try {
    const { tokenMint } = req.body as { tokenMint: string };
    if (!tokenMint) {
      return res.status(400).json({ error: "tokenMint required" });
    }

    const mint = parsePubkey(tokenMint, "tokenMint");
    const program = getProgram() as any;
    const authority = getAuthorityKeypair();
    const custodyVault = onchainPdas.custodyVault(mint);
    const existingCustody = await getConnection().getAccountInfo(custodyVault);
    if (existingCustody) {
      return res.json({
        signature: null,
        custodyVault: custodyVault.toBase58(),
        vaultTokenAccount: null,
        alreadyInitialized: true,
      });
    }

    const vaultTokenAccount = Keypair.generate();

    const ix = await program.methods
      .initializeCustody()
      .accounts({
        custodyVault,
        tokenMint: mint,
        vaultTokenAccount: vaultTokenAccount.publicKey,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    const tx = await buildTransaction(ix, authority.publicKey);
    const sig = await sendSignedTx(tx, [authority, vaultTokenAccount]);

    res.json({
      signature: sig,
      custodyVault: custodyVault.toBase58(),
      vaultTokenAccount: vaultTokenAccount.publicKey.toBase58(),
      alreadyInitialized: false,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tx/create-user", async (req: Request, res: Response) => {
  try {
    const { userPubkey } = req.body as { userPubkey: string };
    if (!userPubkey) {
      return res.status(400).json({ error: "userPubkey required" });
    }

    const user = parsePubkey(userPubkey, "userPubkey");
    const program = getProgram() as any;
    const ix = await program.methods
      .createUser()
      .accounts({
        userProfile: onchainPdas.userProfile(user),
        user,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .instruction();

    const tx = await buildTransaction(ix, user);
    res.json({
      transaction: serializeTx(tx),
      userProfile: onchainPdas.userProfile(user).toBase58(),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/tx/deposit", async (req: Request, res: Response) => {
  try {
    const {
      userPubkey,
      tokenMint,
      userTokenAccount,
      vaultTokenAccount,
      amount,
    } = req.body as {
      userPubkey: string;
      tokenMint: string;
      userTokenAccount: string;
      vaultTokenAccount: string;
      amount: number | string;
    };

    if (!userPubkey || !tokenMint || !userTokenAccount || !vaultTokenAccount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = parsePubkey(userPubkey, "userPubkey");
    const mint = parsePubkey(tokenMint, "tokenMint");
    const userToken = parsePubkey(userTokenAccount, "userTokenAccount");
    const vaultToken = parsePubkey(vaultTokenAccount, "vaultTokenAccount");

    const rawAmount = toRawAmount(amount, mintDecimals(mint));
    const program = getProgram() as any;
    const ix = await program.methods
      .deposit(toBn(rawAmount))
      .accounts({
        userProfile: onchainPdas.userProfile(user),
        userBalance: onchainPdas.userBalance(user, mint),
        custodyVault: onchainPdas.custodyVault(mint),
        tokenMint: mint,
        userTokenAccount: userToken,
        vaultTokenAccount: vaultToken,
        user,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .instruction();

    const tx = await buildTransaction(ix, user);
    res.json({ transaction: serializeTx(tx) });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/tx/withdraw", async (req: Request, res: Response) => {
  try {
    const {
      userPubkey,
      tokenMint,
      userTokenAccount,
      vaultTokenAccount,
      amount,
    } = req.body as {
      userPubkey: string;
      tokenMint: string;
      userTokenAccount: string;
      vaultTokenAccount: string;
      amount: number | string;
    };

    if (!userPubkey || !tokenMint || !userTokenAccount || !vaultTokenAccount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = parsePubkey(userPubkey, "userPubkey");
    const mint = parsePubkey(tokenMint, "tokenMint");
    const userToken = parsePubkey(userTokenAccount, "userTokenAccount");
    const vaultToken = parsePubkey(vaultTokenAccount, "vaultTokenAccount");

    const rawAmount = toRawAmount(amount, mintDecimals(mint));
    const program = getProgram() as any;
    const ix = await program.methods
      .withdraw(toBn(rawAmount))
      .accounts({
        userProfile: onchainPdas.userProfile(user),
        userBalance: onchainPdas.userBalance(user, mint),
        custodyVault: onchainPdas.custodyVault(mint),
        tokenMint: mint,
        vaultTokenAccount: vaultToken,
        userTokenAccount: userToken,
        user,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const tx = await buildTransaction(ix, user);
    res.json({ transaction: serializeTx(tx) });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/tx/place-order", async (req: Request, res: Response) => {
  try {
    const {
      userPubkey,
      tokenMint,
      orderId,
      symbol,
      side,
      orderType,
      price,
      quantity,
    } = req.body as {
      userPubkey: string;
      tokenMint: string;
      orderId: string;
      symbol: string;
      side: string;
      orderType: string;
      price: number | string;
      quantity: number | string;
    };

    if (!userPubkey || !tokenMint || !orderId || !symbol || !side || !orderType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = parsePubkey(userPubkey, "userPubkey");
    const mint = parsePubkey(tokenMint, "tokenMint");

    const rawPrice = toQuoteRawAmount(price);
    const rawQuantity = toBaseRawAmount(quantity);
    const program = getProgram() as any;
    const ix = await program.methods
      .placeOrder({
        orderId,
        symbol,
        side: mapOrderSide(side),
        orderType: mapOrderType(orderType),
        price: toBn(rawPrice),
        quantity: toBn(rawQuantity),
      })
      .accounts({
        exchange: onchainPdas.exchange(),
        userProfile: onchainPdas.userProfile(user),
        order: onchainPdas.order(user, orderId),
        escrow: onchainPdas.escrow(user, orderId),
        userBalance: onchainPdas.userBalance(user, mint),
        custodyVault: onchainPdas.custodyVault(mint),
        tokenMint: mint,
        user,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .instruction();

    const tx = await buildTransaction(ix, user);
    res.json({
      transaction: serializeTx(tx),
      order: onchainPdas.order(user, orderId).toBase58(),
      escrow: onchainPdas.escrow(user, orderId).toBase58(),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/tx/cancel-order", async (req: Request, res: Response) => {
  try {
    const { userPubkey, orderId, tokenMint } = req.body as {
      userPubkey: string;
      orderId: string;
      tokenMint: string;
    };

    if (!userPubkey || !orderId || !tokenMint) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = parsePubkey(userPubkey, "userPubkey");
    const mint = parsePubkey(tokenMint, "tokenMint");

    const program = getProgram() as any;
    const authority = getAuthorityKeypair();
    const ix = await program.methods
      .cancelOrder()
      .accounts({
        exchange: onchainPdas.exchange(),
        authority: authority.publicKey,
        userProfile: onchainPdas.userProfile(user),
        order: onchainPdas.order(user, orderId),
        escrow: onchainPdas.escrow(user, orderId),
        userBalance: onchainPdas.userBalance(user, mint),
        custodyVault: onchainPdas.custodyVault(mint),
        user,
      })
      .instruction();

    const tx = await buildTransaction(ix, authority.publicKey);
    const signature = await sendSignedTx(tx, [authority]);
    res.json({ signature });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/tx/settle-trade", async (req: Request, res: Response) => {
  try {
    const {
      buyerPubkey,
      sellerPubkey,
      baseMint,
      quoteMint,
      buyOrderId,
      sellOrderId,
      tradeId,
      symbol,
      price,
      quantity,
    } = req.body as {
      buyerPubkey: string;
      sellerPubkey: string;
      baseMint: string;
      quoteMint: string;
      buyOrderId: string;
      sellOrderId: string;
      tradeId: string;
      symbol: string;
      price: number | string;
      quantity: number | string;
    };

    if (
      !buyerPubkey ||
      !sellerPubkey ||
      !baseMint ||
      !quoteMint ||
      !buyOrderId ||
      !sellOrderId ||
      !tradeId ||
      !symbol
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const buyer = parsePubkey(buyerPubkey, "buyerPubkey");
    const seller = parsePubkey(sellerPubkey, "sellerPubkey");
    const base = parsePubkey(baseMint, "baseMint");
    const quote = parsePubkey(quoteMint, "quoteMint");

    const program = getProgram() as any;
    const authority = getAuthorityKeypair();
    const ix = await program.methods
      .settleTrade({
        tradeId: onchainId(tradeId),
        symbol,
        price: toBn(price),
        quantity: toBn(quantity),
      })
      .accounts({
        exchange: onchainPdas.exchange(),
        authority: authority.publicKey,
        buyerOrder: onchainPdas.order(buyer, onchainId(buyOrderId)),
        buyerEscrow: onchainPdas.escrow(buyer, onchainId(buyOrderId)),
        buyerBalance: onchainPdas.userBalance(buyer, quote),
        buyerReceivedBalance: onchainPdas.userBalance(buyer, base),
        seller,
        sellerOrder: onchainPdas.order(seller, onchainId(sellOrderId)),
        sellerEscrow: onchainPdas.escrow(seller, onchainId(sellOrderId)),
        sellerBalance: onchainPdas.userBalance(seller, base),
        sellerReceivedBalance: onchainPdas.userBalance(seller, quote),
        baseMint: base,
        quoteMint: quote,
        baseCustody: onchainPdas.custodyVault(base),
        quoteCustody: onchainPdas.custodyVault(quote),
        tradeSettlement: onchainPdas.settlement(onchainId(tradeId)),
        buyer,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .instruction();

    const tx = await buildTransaction(ix, authority.publicKey);
    const signature = await sendSignedTx(tx, [authority]);
    res.json({
      signature,
      tradeSettlement: onchainPdas.settlement(onchainId(tradeId)).toBase58(),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/tx/submit", async (req: Request, res: Response) => {
  try {
    const { transaction } = req.body as { transaction: string };
    if (!transaction) {
      return res.status(400).json({ error: "transaction required" });
    }

    const raw = Buffer.from(transaction, "base64");
    const program = getProgram() as any;
    const sig = await program.provider.connection.sendRawTransaction(raw, {
      skipPreflight: false,
    });
    res.json({ signature: sig });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
