import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { expect } from "chai";
import {
  createAccount,
  createMint,
  getAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { OnChain } from "../target/types/on_chain";

const SYSTEM_PROGRAM_ID = web3.SystemProgram.programId;
const RENT_SYSVAR_ID = web3.SYSVAR_RENT_PUBKEY;

describe("on_chain", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.onChain as Program<OnChain>;
  const payer = (provider.wallet as anchor.Wallet).payer;

  const pda = (seeds: Buffer[]) =>
    web3.PublicKey.findProgramAddressSync(seeds, program.programId)[0];

  const exchange = () => pda([Buffer.from("exchange")]);
  const userProfile = (user: web3.PublicKey) =>
    pda([Buffer.from("user"), user.toBuffer()]);
  const custodyVault = (mint: web3.PublicKey) =>
    pda([Buffer.from("custody"), mint.toBuffer()]);
  const userBalance = (user: web3.PublicKey, mint: web3.PublicKey) =>
    pda([Buffer.from("user-balance"), user.toBuffer(), mint.toBuffer()]);
  const orderPda = (user: web3.PublicKey, orderId: string) =>
    pda([Buffer.from("order"), user.toBuffer(), Buffer.from(orderId)]);
  const escrowPda = (user: web3.PublicKey, orderId: string) =>
    pda([Buffer.from("escrow"), user.toBuffer(), Buffer.from(orderId)]);
  const settlementPda = (tradeId: string) =>
    pda([Buffer.from("settlement"), Buffer.from(tradeId)]);

  const fund = async (key: web3.PublicKey) => {
    const sig = await provider.connection.requestAirdrop(
      key,
      2 * web3.LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  };

  const createTokenFixture = async (
    owner: web3.PublicKey,
    amount: number,
  ) => {
    const mint = await createMint(provider.connection, payer, payer.publicKey, null, 0);
    const tokenAccount = await createAccount(provider.connection, payer, mint, owner);
    await mintTo(provider.connection, payer, mint, tokenAccount, payer, amount);
    const vaultTokenAccount = web3.Keypair.generate();

    await program.methods
      .initializeCustody()
      .accounts({
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        vaultTokenAccount: vaultTokenAccount.publicKey,
        authority: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
        rent: RENT_SYSVAR_ID,
      })
      .signers([vaultTokenAccount])
      .rpc();

    return { mint, tokenAccount, vaultTokenAccount: vaultTokenAccount.publicKey };
  };

  const createUser = async (user: web3.Keypair) => {
    await fund(user.publicKey);
    await program.methods
      .createUser()
      .accounts({
        userProfile: userProfile(user.publicKey),
        user: user.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
  };

  const deposit = async (
    user: web3.Keypair,
    mint: web3.PublicKey,
    tokenAccount: web3.PublicKey,
    vaultTokenAccount: web3.PublicKey,
    amount: number,
  ) => {
    await program.methods
      .deposit(new anchor.BN(amount))
      .accounts({
        userProfile: userProfile(user.publicKey),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        userTokenAccount: tokenAccount,
        vaultTokenAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
  };

  before(async () => {
    await program.methods
      .initialize(25)
      .accounts({
        config: exchange(),
        authority: payer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .rpc();
  });

  it("initializes the exchange config", async () => {
    const config = await program.account.exchangeConfig.fetch(exchange());

    expect(config.authority.toBase58()).to.equal(payer.publicKey.toBase58());
    expect(config.feeBps).to.equal(25);
    expect(config.orderSequence.toNumber()).to.equal(0);
    expect(config.isPaused).to.equal(false);
  });

  it("creates a user profile", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const profile = await program.account.userProfile.fetch(
      userProfile(user.publicKey),
    );
    expect(profile.authority.toBase58()).to.equal(user.publicKey.toBase58());
    expect(profile.createdAt.toNumber()).to.be.greaterThan(0);
  });

  it("deposits and withdraws through custody", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      1_000,
    );

    await deposit(user, mint, tokenAccount, vaultTokenAccount, 600);

    let balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );
    expect(balance.availableAmount.toNumber()).to.equal(600);
    expect(balance.depositedAmount.toNumber()).to.equal(600);

    await program.methods
      .withdraw(new anchor.BN(250))
      .accounts({
        userProfile: userProfile(user.publicKey),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        vaultTokenAccount,
        userTokenAccount: tokenAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );
    const userToken = await getAccount(provider.connection, tokenAccount);
    const vaultToken = await getAccount(provider.connection, vaultTokenAccount);

    expect(balance.availableAmount.toNumber()).to.equal(350);
    expect(balance.withdrawnAmount.toNumber()).to.equal(250);
    expect(Number(userToken.amount)).to.equal(650);
    expect(Number(vaultToken.amount)).to.equal(350);
  });

  it("locks funds for an order and unlocks them on cancellation", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      1_000,
    );
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 500);

    const orderId = "buy-1";
    await program.methods
      .placeOrder({
        orderId,
        symbol: "SOL/USD",
        side: { buy: {} },
        orderType: { limit: {} },
        price: new anchor.BN(10),
        quantity: new anchor.BN(20),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(user.publicKey),
        order: orderPda(user.publicKey, orderId),
        escrow: escrowPda(user.publicKey, orderId),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        user: user.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    let balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );
    let order = await program.account.orderState.fetch(orderPda(user.publicKey, orderId));
    let escrow = await program.account.escrowPosition.fetch(
      escrowPda(user.publicKey, orderId),
    );

    expect(balance.availableAmount.toNumber()).to.equal(300);
    expect(balance.lockedAmount.toNumber()).to.equal(200);
    expect(order.remainingQuantity.toNumber()).to.equal(20);
    expect(order.status).to.deep.equal({ resting: {} });
    expect(escrow.lockedAmount.toNumber()).to.equal(200);
    expect(escrow.status).to.deep.equal({ locked: {} });

    await program.methods
      .cancelOrder()
      .accounts({
        userProfile: userProfile(user.publicKey),
        order: orderPda(user.publicKey, orderId),
        escrow: escrowPda(user.publicKey, orderId),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

    balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );
    order = await program.account.orderState.fetch(orderPda(user.publicKey, orderId));
    escrow = await program.account.escrowPosition.fetch(
      escrowPda(user.publicKey, orderId),
    );

    expect(balance.availableAmount.toNumber()).to.equal(500);
    expect(balance.lockedAmount.toNumber()).to.equal(0);
    expect(order.status).to.deep.equal({ cancelled: {} });
    expect(escrow.status).to.deep.equal({ cancelled: {} });
  });

  it("settles a valid trade using locked and received balance accounts", async () => {
    const buyer = web3.Keypair.generate();
    const seller = web3.Keypair.generate();
    await createUser(buyer);
    await createUser(seller);

    const base = await createTokenFixture(buyer.publicKey, 10);
    const quote = await createTokenFixture(buyer.publicKey, 1_000);
    const sellerBaseTokenAccount = await createAccount(
      provider.connection,
      payer,
      base.mint,
      seller.publicKey,
    );
    const sellerQuoteTokenAccount = await createAccount(
      provider.connection,
      payer,
      quote.mint,
      seller.publicKey,
    );
    await mintTo(
      provider.connection,
      payer,
      base.mint,
      sellerBaseTokenAccount,
      payer,
      100,
    );
    await mintTo(
      provider.connection,
      payer,
      quote.mint,
      sellerQuoteTokenAccount,
      payer,
      10,
    );

    await deposit(buyer, base.mint, base.tokenAccount, base.vaultTokenAccount, 1);
    await deposit(seller, quote.mint, sellerQuoteTokenAccount, quote.vaultTokenAccount, 1);
    await deposit(buyer, quote.mint, quote.tokenAccount, quote.vaultTokenAccount, 500);
    await deposit(seller, base.mint, sellerBaseTokenAccount, base.vaultTokenAccount, 50);

    const buyOrderId = "buy-settle-1";
    const sellOrderId = "sell-settle-1";

    await program.methods
      .placeOrder({
        orderId: buyOrderId,
        symbol: "SOL/USD",
        side: { buy: {} },
        orderType: { limit: {} },
        price: new anchor.BN(10),
        quantity: new anchor.BN(20),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(buyer.publicKey),
        order: orderPda(buyer.publicKey, buyOrderId),
        escrow: escrowPda(buyer.publicKey, buyOrderId),
        userBalance: userBalance(buyer.publicKey, quote.mint),
        custodyVault: custodyVault(quote.mint),
        tokenMint: quote.mint,
        user: buyer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    await program.methods
      .placeOrder({
        orderId: sellOrderId,
        symbol: "SOL/USD",
        side: { sell: {} },
        orderType: { limit: {} },
        price: new anchor.BN(9),
        quantity: new anchor.BN(20),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(seller.publicKey),
        order: orderPda(seller.publicKey, sellOrderId),
        escrow: escrowPda(seller.publicKey, sellOrderId),
        userBalance: userBalance(seller.publicKey, base.mint),
        custodyVault: custodyVault(base.mint),
        tokenMint: base.mint,
        user: seller.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([seller])
      .rpc();

    await program.methods
      .settleTrade({
        tradeId: "trade-1",
        symbol: "SOL/USD",
        price: new anchor.BN(10),
        quantity: new anchor.BN(20),
      })
      .accounts({
        buyerProfile: userProfile(buyer.publicKey),
        buyerOrder: orderPda(buyer.publicKey, buyOrderId),
        buyerEscrow: escrowPda(buyer.publicKey, buyOrderId),
        buyerBalance: userBalance(buyer.publicKey, quote.mint),
        buyerReceivedBalance: userBalance(buyer.publicKey, base.mint),
        sellerProfile: userProfile(seller.publicKey),
        seller: seller.publicKey,
        sellerOrder: orderPda(seller.publicKey, sellOrderId),
        sellerEscrow: escrowPda(seller.publicKey, sellOrderId),
        sellerBalance: userBalance(seller.publicKey, base.mint),
        sellerReceivedBalance: userBalance(seller.publicKey, quote.mint),
        baseMint: base.mint,
        quoteMint: quote.mint,
        baseCustody: custodyVault(base.mint),
        quoteCustody: custodyVault(quote.mint),
        tradeSettlement: settlementPda("trade-1"),
        buyer: buyer.publicKey,
        payer: payer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    const buyerQuoteBalance = await program.account.userBalance.fetch(
      userBalance(buyer.publicKey, quote.mint),
    );
    const sellerBaseBalance = await program.account.userBalance.fetch(
      userBalance(seller.publicKey, base.mint),
    );
    const buyerBaseBalance = await program.account.userBalance.fetch(
      userBalance(buyer.publicKey, base.mint),
    );
    const sellerQuoteBalance = await program.account.userBalance.fetch(
      userBalance(seller.publicKey, quote.mint),
    );

    expect(buyerQuoteBalance.lockedAmount.toNumber()).to.equal(0);
    expect(sellerBaseBalance.lockedAmount.toNumber()).to.equal(0);
    expect(buyerBaseBalance.availableAmount.toNumber()).to.equal(21);
    expect(sellerQuoteBalance.availableAmount.toNumber()).to.equal(201);
  });
  /**
   * Fully wires up two users, mints, deposits, and two matching orders,
   * then settles them. Returns all relevant PDAs and the order states so
   * that fee assertions can be made inline.
   *
   * buyerPlacedFirst = true  → buyer has lower sequenceId → buyer is MAKER
   * buyerPlacedFirst = false → seller has lower sequenceId → seller is MAKER
   */
  const settleTradeFixture = async (opts: {
    tradeId: string;
    price: number;
    quantity: number;
    buyerPlacedFirst: boolean;
    buyOrderId: string;
    sellOrderId: string;
  }) => {
    const buyer = web3.Keypair.generate();
    const seller = web3.Keypair.generate();
    await createUser(buyer);
    await createUser(seller);

    // base token (what buyer wants, seller holds)
    const baseMint = await createMint(provider.connection, payer, payer.publicKey, null, 0);
    const buyerBaseTokenAcc = await createAccount(provider.connection, payer, baseMint, buyer.publicKey);
    const sellerBaseTokenAcc = await createAccount(provider.connection, payer, baseMint, seller.publicKey);
    await mintTo(provider.connection, payer, baseMint, sellerBaseTokenAcc, payer, opts.quantity * 10);
    await mintTo(provider.connection, payer, baseMint, buyerBaseTokenAcc, payer, 10); // Mint to buyer for balance initialization
    const baseVaultKP = web3.Keypair.generate();
    await program.methods.initializeCustody().accounts({
      custodyVault: custodyVault(baseMint),
      tokenMint: baseMint,
      vaultTokenAccount: baseVaultKP.publicKey,
      authority: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
      rent: RENT_SYSVAR_ID,
    }).signers([baseVaultKP]).rpc();

    // quote token (what seller wants, buyer holds)
    const quoteMint = await createMint(provider.connection, payer, payer.publicKey, null, 0);
    const buyerQuoteTokenAcc = await createAccount(provider.connection, payer, quoteMint, buyer.publicKey);
    const sellerQuoteTokenAcc = await createAccount(provider.connection, payer, quoteMint, seller.publicKey);
    const quoteNeeded = opts.price * opts.quantity;
    await mintTo(provider.connection, payer, quoteMint, buyerQuoteTokenAcc, payer, quoteNeeded * 10);
    await mintTo(provider.connection, payer, quoteMint, sellerQuoteTokenAcc, payer, 10); // Mint to seller for balance initialization
    const quoteVaultKP = web3.Keypair.generate();
    await program.methods.initializeCustody().accounts({
      custodyVault: custodyVault(quoteMint),
      tokenMint: quoteMint,
      vaultTokenAccount: quoteVaultKP.publicKey,
      authority: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
      rent: RENT_SYSVAR_ID,
    }).signers([quoteVaultKP]).rpc();

    // Deposit: buyer deposits quote, seller deposits base
    // Also: buyer deposits small amount of base to initialize balance account for settlement
    // And: seller deposits small amount of quote to initialize balance account for settlement
    await deposit(buyer, quoteMint, buyerQuoteTokenAcc, quoteVaultKP.publicKey, quoteNeeded * 5);
    await deposit(seller, baseMint, sellerBaseTokenAcc, baseVaultKP.publicKey, opts.quantity * 5);
    await deposit(buyer, baseMint, buyerBaseTokenAcc, baseVaultKP.publicKey, 1); // Initialize buyer's base balance
    await deposit(seller, quoteMint, sellerQuoteTokenAcc, quoteVaultKP.publicKey, 1); // Initialize seller's quote balance

    const placeBuyOrder = () =>
      program.methods
        .placeOrder({
          orderId: opts.buyOrderId,
          symbol: "SOL/USD",
          side: { buy: {} },
          orderType: { limit: {} },
          price: new anchor.BN(opts.price),
          quantity: new anchor.BN(opts.quantity),
        })
        .accounts({
          exchange: exchange(),
          userProfile: userProfile(buyer.publicKey),
          order: orderPda(buyer.publicKey, opts.buyOrderId),
          escrow: escrowPda(buyer.publicKey, opts.buyOrderId),
          userBalance: userBalance(buyer.publicKey, quoteMint),
          custodyVault: custodyVault(quoteMint),
          tokenMint: quoteMint,
          user: buyer.publicKey,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

    const placeSellOrder = () =>
      program.methods
        .placeOrder({
          orderId: opts.sellOrderId,
          symbol: "SOL/USD",
          side: { sell: {} },
          orderType: { limit: {} },
          price: new anchor.BN(opts.price),
          quantity: new anchor.BN(opts.quantity),
        })
        .accounts({
          exchange: exchange(),
          userProfile: userProfile(seller.publicKey),
          order: orderPda(seller.publicKey, opts.sellOrderId),
          escrow: escrowPda(seller.publicKey, opts.sellOrderId),
          userBalance: userBalance(seller.publicKey, baseMint),
          custodyVault: custodyVault(baseMint),
          tokenMint: baseMint,
          user: seller.publicKey,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();

    // Order placement order determines maker/taker via sequenceId
    if (opts.buyerPlacedFirst) {
      await placeBuyOrder();
      await placeSellOrder();
    } else {
      await placeSellOrder();
      await placeBuyOrder();
    }

    // Snapshot balances before settlement
    const buyerQuoteBalBefore = await program.account.userBalance.fetch(
      userBalance(buyer.publicKey, quoteMint),
    );
    const sellerBaseBalBefore = await program.account.userBalance.fetch(
      userBalance(seller.publicKey, baseMint),
    );

    await program.methods
      .settleTrade({
        tradeId: opts.tradeId,
        symbol: "SOL/USD",
        price: new anchor.BN(opts.price),
        quantity: new anchor.BN(opts.quantity),
      })
      .accounts({
        buyerProfile: userProfile(buyer.publicKey),
        buyerOrder: orderPda(buyer.publicKey, opts.buyOrderId),
        buyerEscrow: escrowPda(buyer.publicKey, opts.buyOrderId),
        buyerBalance: userBalance(buyer.publicKey, quoteMint),   // buyer releases locked quote
        buyerReceivedBalance: userBalance(buyer.publicKey, baseMint),   // buyer receives base
        sellerProfile: userProfile(seller.publicKey),
        seller: seller.publicKey,
        sellerOrder: orderPda(seller.publicKey, opts.sellOrderId),
        sellerEscrow: escrowPda(seller.publicKey, opts.sellOrderId),
        sellerBalance: userBalance(seller.publicKey, baseMint), // seller releases locked base
        sellerReceivedBalance: userBalance(seller.publicKey, quoteMint), // seller receives quote
        baseMint,
        quoteMint,
        baseCustody: custodyVault(baseMint),
        quoteCustody: custodyVault(quoteMint),
        tradeSettlement: settlementPda(opts.tradeId),
        buyer: buyer.publicKey,
        payer: payer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    return {
      buyer,
      seller,
      baseMint,
      quoteMint,
      baseVaultTokenAccount: baseVaultKP.publicKey,
      quoteVaultTokenAccount: quoteVaultKP.publicKey,
      buyerQuoteBalBefore,
      sellerBaseBalBefore,
    };
  };



  it("settles a trade and charges 0.02% maker fee to buyer (buyer placed first)", async () => {
    const PRICE = 100;
    const QTY = 50;
    const QUOTE_AMOUNT = PRICE * QTY; // 5000
    const MAKER_FEE_BPS = 2;
    const TAKER_FEE_BPS = 6;
    const BPS_DENOM = 10_000;

    // buyer placed first → buyer is maker (0.02% on base qty)
    // seller is taker → 0.06% on quote amount
    const expectedBuyerFee = Math.floor((QTY * MAKER_FEE_BPS) / BPS_DENOM);     // 0
    const expectedSellerFee = Math.floor((QUOTE_AMOUNT * TAKER_FEE_BPS) / BPS_DENOM); // 3
    const buyerReceives = QTY - expectedBuyerFee;        // 50
    const sellerReceives = QUOTE_AMOUNT - expectedSellerFee; // 4997

    const {
      buyer, seller, baseMint, quoteMint,
    } = await settleTradeFixture({
      tradeId: "fee-trade-buyer-maker",
      price: PRICE,
      quantity: QTY,
      buyerPlacedFirst: true,
      buyOrderId: "fee-buy-1",
      sellOrderId: "fee-sell-1",
    });

    // ── Buyer balance: received base tokens net of maker fee ──
    const buyerBaseBal = await program.account.userBalance.fetch(
      userBalance(buyer.publicKey, baseMint),
    );
    expect(buyerBaseBal.availableAmount.toNumber()).to.equal(
      buyerReceives + 1,
      `buyer should receive ${buyerReceives} base tokens (${QTY} - ${expectedBuyerFee} maker fee)`,
    );

    // ── Seller balance: received quote tokens net of taker fee ──
    const sellerQuoteBal = await program.account.userBalance.fetch(
      userBalance(seller.publicKey, quoteMint),
    );
    expect(sellerQuoteBal.availableAmount.toNumber()).to.equal(
      sellerReceives + 1,
      `seller should receive ${sellerReceives} quote tokens (${QUOTE_AMOUNT} - ${expectedSellerFee} taker fee)`,
    );

    // ── Custody vaults accumulated fees ──
    const baseCustody = await program.account.custodyVault.fetch(custodyVault(baseMint));
    expect(baseCustody.totalFeesCollected.toNumber()).to.equal(
      expectedBuyerFee,
      "base custody should hold buyer (maker) fee",
    );

    const quoteCustody = await program.account.custodyVault.fetch(custodyVault(quoteMint));
    expect(quoteCustody.totalFeesCollected.toNumber()).to.equal(
      expectedSellerFee,
      "quote custody should hold seller (taker) fee",
    );

    // ── Settlement record ──
    const settlement = await program.account.tradeSettlement.fetch(
      settlementPda("fee-trade-buyer-maker"),
    );
    expect(settlement.makerFee.toNumber()).to.equal(expectedBuyerFee);
    expect(settlement.takerFee.toNumber()).to.equal(expectedSellerFee);
    expect(settlement.status).to.deep.equal({ settled: {} });
    expect(settlement.price.toNumber()).to.equal(PRICE);
    expect(settlement.quantity.toNumber()).to.equal(QTY);
    expect(settlement.quoteAmount.toNumber()).to.equal(QUOTE_AMOUNT);
  });

  it("settles a trade and charges 0.02% maker fee to seller (seller placed first)", async () => {
    const PRICE = 200;
    const QTY = 30;
    const QUOTE_AMOUNT = PRICE * QTY; // 6000
    const MAKER_FEE_BPS = 2;
    const TAKER_FEE_BPS = 6;
    const BPS_DENOM = 10_000;

    // seller placed first → seller is maker (0.02% on quote amount)
    // buyer is taker → 0.06% on base qty
    const expectedSellerFee = Math.floor((QUOTE_AMOUNT * MAKER_FEE_BPS) / BPS_DENOM); // 1
    const expectedBuyerFee = Math.floor((QTY * TAKER_FEE_BPS) / BPS_DENOM);           // 0
    const buyerReceives = QTY - expectedBuyerFee;           // 30
    const sellerReceives = QUOTE_AMOUNT - expectedSellerFee; // 5999

    const {
      buyer, seller, baseMint, quoteMint,
    } = await settleTradeFixture({
      tradeId: "fee-trade-seller-maker",
      price: PRICE,
      quantity: QTY,
      buyerPlacedFirst: false, // seller places first → seller is maker
      buyOrderId: "fee-buy-2",
      sellOrderId: "fee-sell-2",
    });

    const buyerBaseBal = await program.account.userBalance.fetch(
      userBalance(buyer.publicKey, baseMint),
    );
    expect(buyerBaseBal.availableAmount.toNumber()).to.equal(
      buyerReceives + 1,
      `buyer (taker) should receive ${buyerReceives} base tokens`,
    );

    const sellerQuoteBal = await program.account.userBalance.fetch(
      userBalance(seller.publicKey, quoteMint),
    );
    expect(sellerQuoteBal.availableAmount.toNumber()).to.equal(
      sellerReceives + 1,
      `seller (maker) should receive ${sellerReceives} quote tokens`,
    );

    const baseCustody = await program.account.custodyVault.fetch(custodyVault(baseMint));
    expect(baseCustody.totalFeesCollected.toNumber()).to.equal(
      expectedBuyerFee,
      "base custody should hold buyer (taker) fee",
    );

    const quoteCustody = await program.account.custodyVault.fetch(custodyVault(quoteMint));
    expect(quoteCustody.totalFeesCollected.toNumber()).to.equal(
      expectedSellerFee,
      "quote custody should hold seller (maker) fee",
    );

    const settlement = await program.account.tradeSettlement.fetch(
      settlementPda("fee-trade-seller-maker"),
    );
    // seller is maker → makerFee is on quote side
    expect(settlement.makerFee.toNumber()).to.equal(expectedSellerFee);
    expect(settlement.takerFee.toNumber()).to.equal(expectedBuyerFee);
    expect(settlement.status).to.deep.equal({ settled: {} });
  });

  it("settles a partial fill and fees scale proportionally with quantity", async () => {
    const PRICE = 50;
    const FULL_QTY = 100;
    const PARTIAL_QTY = 40; // only settle 40 out of 100
    const QUOTE_AMOUNT = PRICE * PARTIAL_QTY; // 2000
    const MAKER_FEE_BPS = 2;
    const TAKER_FEE_BPS = 6;
    const BPS_DENOM = 10_000;

    // buyer placed first → buyer is maker
    const expectedBuyerFee = Math.floor((PARTIAL_QTY * MAKER_FEE_BPS) / BPS_DENOM);    // 0
    const expectedSellerFee = Math.floor((QUOTE_AMOUNT * TAKER_FEE_BPS) / BPS_DENOM);  // 1
    const buyerReceives = PARTIAL_QTY - expectedBuyerFee;       // 40
    const sellerReceives = QUOTE_AMOUNT - expectedSellerFee;    // 1999

    const buyer = web3.Keypair.generate();
    const seller = web3.Keypair.generate();
    await createUser(buyer);
    await createUser(seller);

    const baseMint = await createMint(provider.connection, payer, payer.publicKey, null, 0);
    const buyerBaseTokenAcc = await createAccount(provider.connection, payer, baseMint, buyer.publicKey);
    const sellerBaseTokenAcc = await createAccount(provider.connection, payer, baseMint, seller.publicKey);
    await mintTo(provider.connection, payer, baseMint, sellerBaseTokenAcc, payer, FULL_QTY * 5);
    await mintTo(provider.connection, payer, baseMint, buyerBaseTokenAcc, payer, 10); // Mint to buyer for balance initialization
    const baseVaultKP = web3.Keypair.generate();
    await program.methods.initializeCustody().accounts({
      custodyVault: custodyVault(baseMint),
      tokenMint: baseMint,
      vaultTokenAccount: baseVaultKP.publicKey,
      authority: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
      rent: RENT_SYSVAR_ID,
    }).signers([baseVaultKP]).rpc();

    const quoteMint = await createMint(provider.connection, payer, payer.publicKey, null, 0);
    const buyerQuoteTokenAcc = await createAccount(provider.connection, payer, quoteMint, buyer.publicKey);
    const sellerQuoteTokenAcc = await createAccount(provider.connection, payer, quoteMint, seller.publicKey);
    await mintTo(provider.connection, payer, quoteMint, buyerQuoteTokenAcc, payer, PRICE * FULL_QTY * 5);
    await mintTo(provider.connection, payer, quoteMint, sellerQuoteTokenAcc, payer, 10); // Mint to seller for balance initialization
    const quoteVaultKP = web3.Keypair.generate();
    await program.methods.initializeCustody().accounts({
      custodyVault: custodyVault(quoteMint),
      tokenMint: quoteMint,
      vaultTokenAccount: quoteVaultKP.publicKey,
      authority: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
      rent: RENT_SYSVAR_ID,
    }).signers([quoteVaultKP]).rpc();

    await deposit(buyer, quoteMint, buyerQuoteTokenAcc, quoteVaultKP.publicKey, PRICE * FULL_QTY * 2);
    await deposit(seller, baseMint, sellerBaseTokenAcc, baseVaultKP.publicKey, FULL_QTY * 2);
    await deposit(buyer, baseMint, buyerBaseTokenAcc, baseVaultKP.publicKey, 1); // Initialize buyer's base balance for settlement
    await deposit(seller, quoteMint, sellerQuoteTokenAcc, quoteVaultKP.publicKey, 1); // Initialize seller's quote balance for settlement

    const buyOrderId = "partial-buy";
    const sellOrderId = "partial-sell";

    // buyer places first → buyer is maker
    await program.methods
      .placeOrder({
        orderId: buyOrderId,
        symbol: "SOL/USD",
        side: { buy: {} },
        orderType: { limit: {} },
        price: new anchor.BN(PRICE),
        quantity: new anchor.BN(FULL_QTY),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(buyer.publicKey),
        order: orderPda(buyer.publicKey, buyOrderId),
        escrow: escrowPda(buyer.publicKey, buyOrderId),
        userBalance: userBalance(buyer.publicKey, quoteMint),
        custodyVault: custodyVault(quoteMint),
        tokenMint: quoteMint,
        user: buyer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    await program.methods
      .placeOrder({
        orderId: sellOrderId,
        symbol: "SOL/USD",
        side: { sell: {} },
        orderType: { limit: {} },
        price: new anchor.BN(PRICE),
        quantity: new anchor.BN(FULL_QTY),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(seller.publicKey),
        order: orderPda(seller.publicKey, sellOrderId),
        escrow: escrowPda(seller.publicKey, sellOrderId),
        userBalance: userBalance(seller.publicKey, baseMint),
        custodyVault: custodyVault(baseMint),
        tokenMint: baseMint,
        user: seller.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([seller])
      .rpc();

    // Settle only PARTIAL_QTY
    await program.methods
      .settleTrade({
        tradeId: "partial-trade",
        symbol: "SOL/USD",
        price: new anchor.BN(PRICE),
        quantity: new anchor.BN(PARTIAL_QTY),
      })
      .accounts({
        buyerProfile: userProfile(buyer.publicKey),
        buyerOrder: orderPda(buyer.publicKey, buyOrderId),
        buyerEscrow: escrowPda(buyer.publicKey, buyOrderId),
        buyerBalance: userBalance(buyer.publicKey, quoteMint),
        buyerReceivedBalance: userBalance(buyer.publicKey, baseMint),
        sellerProfile: userProfile(seller.publicKey),
        seller: seller.publicKey,
        sellerOrder: orderPda(seller.publicKey, sellOrderId),
        sellerEscrow: escrowPda(seller.publicKey, sellOrderId),
        sellerBalance: userBalance(seller.publicKey, baseMint),
        sellerReceivedBalance: userBalance(seller.publicKey, quoteMint),
        baseMint,
        quoteMint,
        baseCustody: custodyVault(baseMint),
        quoteCustody: custodyVault(quoteMint),
        tradeSettlement: settlementPda("partial-trade"),
        buyer: buyer.publicKey,
        payer: payer.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    // Buyer received partial base (net of fee)
    const buyerBaseBal = await program.account.userBalance.fetch(
      userBalance(buyer.publicKey, baseMint),
    );
    expect(buyerBaseBal.availableAmount.toNumber()).to.equal(buyerReceives + 1);

    // Seller received partial quote (net of fee)
    const sellerQuoteBal = await program.account.userBalance.fetch(
      userBalance(seller.publicKey, quoteMint),
    );
    expect(sellerQuoteBal.availableAmount.toNumber()).to.equal(sellerReceives + 1);

    // Orders are partially filled, not fully done
    const buyerOrder = await program.account.orderState.fetch(
      orderPda(buyer.publicKey, buyOrderId),
    );
    const sellerOrder = await program.account.orderState.fetch(
      orderPda(seller.publicKey, sellOrderId),
    );
    expect(buyerOrder.status).to.deep.equal({ partiallyFilled: {} });
    expect(sellerOrder.status).to.deep.equal({ partiallyFilled: {} });
    expect(buyerOrder.filledQuantity.toNumber()).to.equal(PARTIAL_QTY);
    expect(buyerOrder.remainingQuantity.toNumber()).to.equal(FULL_QTY - PARTIAL_QTY);

    // Custody fees
    const baseCustody = await program.account.custodyVault.fetch(custodyVault(baseMint));
    expect(baseCustody.totalFeesCollected.toNumber()).to.equal(expectedBuyerFee);

    const quoteCustody = await program.account.custodyVault.fetch(custodyVault(quoteMint));
    expect(quoteCustody.totalFeesCollected.toNumber()).to.equal(expectedSellerFee);

    // Settlement record
    const settlement = await program.account.tradeSettlement.fetch(
      settlementPda("partial-trade"),
    );
    expect(settlement.makerFee.toNumber()).to.equal(expectedBuyerFee);
    expect(settlement.takerFee.toNumber()).to.equal(expectedSellerFee);
    expect(settlement.quantity.toNumber()).to.equal(PARTIAL_QTY);
    expect(settlement.quoteAmount.toNumber()).to.equal(QUOTE_AMOUNT);
  });
});
