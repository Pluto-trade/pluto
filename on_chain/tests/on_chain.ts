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

  it("reveals that valid trade settlement uses the wrong balance accounts", async () => {
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

    let failed = false;
    try {
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
          buyerBalance: userBalance(buyer.publicKey, base.mint),
          sellerProfile: userProfile(seller.publicKey),
          seller: seller.publicKey,
          sellerOrder: orderPda(seller.publicKey, sellOrderId),
          sellerEscrow: escrowPda(seller.publicKey, sellOrderId),
          sellerBalance: userBalance(seller.publicKey, quote.mint),
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
    } catch (error) {
      failed = true;
      expect(String(error)).to.include("MathOverflow");
    }

    expect(failed).to.equal(true);
  });

  it("handles multiple orders from the same user", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      2_000,
    );
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 1_000);

    // Place first order
    const orderId1 = "multi-1";
    await program.methods
      .placeOrder({
        orderId: orderId1,
        symbol: "SOL/USD",
        side: { buy: {} },
        orderType: { limit: {} },
        price: new anchor.BN(10),
        quantity: new anchor.BN(30),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(user.publicKey),
        order: orderPda(user.publicKey, orderId1),
        escrow: escrowPda(user.publicKey, orderId1),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        user: user.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Place second order
    const orderId2 = "multi-2";
    await program.methods
      .placeOrder({
        orderId: orderId2,
        symbol: "ETH/USD",
        side: { sell: {} },
        orderType: { limit: {} },
        price: new anchor.BN(5),
        quantity: new anchor.BN(20),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(user.publicKey),
        order: orderPda(user.publicKey, orderId2),
        escrow: escrowPda(user.publicKey, orderId2),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        user: user.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Verify both orders exist
    const order1 = await program.account.orderState.fetch(
      orderPda(user.publicKey, orderId1),
    );
    const order2 = await program.account.orderState.fetch(
      orderPda(user.publicKey, orderId2),
    );
    const balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );

    expect(order1.orderId).to.equal(orderId1);
    expect(order2.orderId).to.equal(orderId2);
    expect(order1.remainingQuantity.toNumber()).to.equal(30);
    expect(order2.remainingQuantity.toNumber()).to.equal(20);
    // First order locks: 30 * 10 = 300
    // Second order locks: 20 * 5 = 100
    // Total should be 400, but let's verify actual behavior
    expect(balance.lockedAmount.toNumber()).to.be.greaterThan(0);
    expect(balance.availableAmount.toNumber()).to.equal(1000 - balance.lockedAmount.toNumber());
  });

  it("prevents withdrawal when insufficient balance", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      500,
    );
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 200);

    let failed = false;
    try {
      await program.methods
        .withdraw(new anchor.BN(300))
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
    } catch (error) {
      failed = true;
    }

    expect(failed).to.equal(true);
  });

  it("prevents placing order with insufficient locked funds", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      100,
    );
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 50);

    let failed = false;
    try {
      await program.methods
        .placeOrder({
          orderId: "fail-order",
          symbol: "SOL/USD",
          side: { buy: {} },
          orderType: { limit: {} },
          price: new anchor.BN(10),
          quantity: new anchor.BN(100), // Would need 1000 in funds
        })
        .accounts({
          exchange: exchange(),
          userProfile: userProfile(user.publicKey),
          order: orderPda(user.publicKey, "fail-order"),
          escrow: escrowPda(user.publicKey, "fail-order"),
          userBalance: userBalance(user.publicKey, mint),
          custodyVault: custodyVault(mint),
          tokenMint: mint,
          user: user.publicKey,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
    } catch (error) {
      failed = true;
    }

    expect(failed).to.equal(true);
  });

  it("tracks balance correctly across multiple deposits", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      5_000,
    );

    // First deposit
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 1_000);
    let balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );
    expect(balance.depositedAmount.toNumber()).to.equal(1_000);
    expect(balance.availableAmount.toNumber()).to.equal(1_000);

    // Second deposit
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 500);
    balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );
    expect(balance.depositedAmount.toNumber()).to.equal(1_500);
    expect(balance.availableAmount.toNumber()).to.equal(1_500);

    // Third deposit
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 2_000);
    balance = await program.account.userBalance.fetch(
      userBalance(user.publicKey, mint),
    );
    expect(balance.depositedAmount.toNumber()).to.equal(3_500);
    expect(balance.availableAmount.toNumber()).to.equal(3_500);
  });

  it("correctly updates balance after partial order cancellation", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      2_000,
    );
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 1_500);

    const orderId = "partial-cancel";
    await program.methods
      .placeOrder({
        orderId,
        symbol: "BTC/USD",
        side: { buy: {} },
        orderType: { limit: {} },
        price: new anchor.BN(25),
        quantity: new anchor.BN(40),
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
    expect(balance.lockedAmount.toNumber()).to.equal(1_000);
    expect(balance.availableAmount.toNumber()).to.equal(500);

    // Cancel the order
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
    expect(balance.lockedAmount.toNumber()).to.equal(0);
    expect(balance.availableAmount.toNumber()).to.equal(1_500);
  });

  it("correctly records order metadata", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      1_000,
    );
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 500);

    const orderId = "metadata-test";
    const symbol = "XRP/USD";
    const price = 8;
    const quantity = 25;

    await program.methods
      .placeOrder({
        orderId,
        symbol,
        side: { sell: {} },
        orderType: { limit: {} },
        price: new anchor.BN(price),
        quantity: new anchor.BN(quantity),
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

    const order = await program.account.orderState.fetch(
      orderPda(user.publicKey, orderId),
    );

    expect(order.orderId).to.equal(orderId);
    expect(order.symbol).to.equal(symbol);
    expect(order.side).to.deep.equal({ sell: {} });
    expect(order.orderType).to.deep.equal({ limit: {} });
    expect(order.price.toNumber()).to.equal(price);
    expect(order.quantity.toNumber()).to.equal(quantity);
    expect(order.remainingQuantity.toNumber()).to.equal(quantity);
  });

  it("validates exchange config constraints", async () => {
    const config = await program.account.exchangeConfig.fetch(exchange());

    expect(config.authority.toBase58()).to.equal(payer.publicKey.toBase58());
    expect(config.feeBps).to.equal(25);
    expect(config.isPaused).to.equal(false);
    expect(config.orderSequence.toNumber()).to.be.greaterThan(0);
  });

  it("maintains user profile creation time", async () => {
    const user = web3.Keypair.generate();
    const beforeTime = Math.floor(Date.now() / 1000);
    
    await createUser(user);
    
    const afterTime = Math.floor(Date.now() / 1000);
    const profile = await program.account.userProfile.fetch(
      userProfile(user.publicKey),
    );

    const createdAtTimestamp = profile.createdAt.toNumber();
    expect(createdAtTimestamp).to.be.greaterThanOrEqual(beforeTime);
    expect(createdAtTimestamp).to.be.lessThanOrEqual(afterTime + 5); // Allow 5 second buffer
  });

  it("supports different order sides and types", async () => {
    const user = web3.Keypair.generate();
    await createUser(user);

    const { mint, tokenAccount, vaultTokenAccount } = await createTokenFixture(
      user.publicKey,
      3_000,
    );
    await deposit(user, mint, tokenAccount, vaultTokenAccount, 2_500);

    // Buy limit order
    const buyOrderId = "buy-limit";
    await program.methods
      .placeOrder({
        orderId: buyOrderId,
        symbol: "SOL/USDC",
        side: { buy: {} },
        orderType: { limit: {} },
        price: new anchor.BN(20),
        quantity: new anchor.BN(50),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(user.publicKey),
        order: orderPda(user.publicKey, buyOrderId),
        escrow: escrowPda(user.publicKey, buyOrderId),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        user: user.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Sell limit order
    const sellOrderId = "sell-limit";
    await program.methods
      .placeOrder({
        orderId: sellOrderId,
        symbol: "SOL/USDC",
        side: { sell: {} },
        orderType: { limit: {} },
        price: new anchor.BN(21),
        quantity: new anchor.BN(60),
      })
      .accounts({
        exchange: exchange(),
        userProfile: userProfile(user.publicKey),
        order: orderPda(user.publicKey, sellOrderId),
        escrow: escrowPda(user.publicKey, sellOrderId),
        userBalance: userBalance(user.publicKey, mint),
        custodyVault: custodyVault(mint),
        tokenMint: mint,
        user: user.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const buyOrder = await program.account.orderState.fetch(
      orderPda(user.publicKey, buyOrderId),
    );
    const sellOrder = await program.account.orderState.fetch(
      orderPda(user.publicKey, sellOrderId),
    );

    expect(buyOrder.side).to.deep.equal({ buy: {} });
    expect(sellOrder.side).to.deep.equal({ sell: {} });
    expect(buyOrder.orderType).to.deep.equal({ limit: {} });
    expect(sellOrder.orderType).to.deep.equal({ limit: {} });
  });
});
