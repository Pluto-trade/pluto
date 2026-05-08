import "dotenv/config";
import { prisma } from "./client";

const REASONS = [
  "STRONG_STALE",
  "DEVIATION",
  "DEVIATION_HIGH_VOL",
  "DELAY",
  "DELAY_HIGH_VOL",
] as const;

const TRADERS = [
  { name: "alice", email: "alice@plut0x.dev", wallet: "AliceSoLA1iceSoLA1iceSoLA1iceSoLA1iceSoLA" },
  { name: "bob", email: "bob@plut0x.dev", wallet: "BobSoLABobSoLABobSoLABobSoLABobSoLABobSoLAB" },
  { name: "carol", email: "carol@plut0x.dev", wallet: "CaroLSoLA1CaroLSoLA1CaroLSoLA1CaroLSoLA1Car" },
  { name: "dave", email: "dave@plut0x.dev", wallet: "DaveSoLA1DaveSoLA1DaveSoLA1DaveSoLA1DaveSoL" },
  { name: "erin", email: "erin@plut0x.dev", wallet: "ErinSoLA1ErinSoLA1ErinSoLA1ErinSoLA1ErinSoL" },
];

const MARKETS = [
  { symbol: "SOL-USDC", base: "SOL", quote: "USDC", price: 150 },
  { symbol: "JUP-USDC", base: "JUP", quote: "USDC", price: 0.85 },
  { symbol: "WIF-USDC", base: "WIF", quote: "USDC", price: 2.4 },
];

const WEIGHT = [3, 5, 2, 1, 1]; // alice carries most savings, last two trail

async function main() {
  console.log("Seeding MPE demo data into the database…");

  // 1. Markets
  const markets = await Promise.all(
    MARKETS.map((m) =>
      prisma.market.upsert({
        where: { symbol: m.symbol },
        update: {},
        create: {
          symbol: m.symbol,
          baseAsset: m.base,
          quoteAsset: m.quote,
          status: "ACTIVE",
          tickSize: "0.01",
          lotSize: "0.001",
          minOrderSize: "0.1",
          pricePrecision: 4,
          sizePrecision: 3,
          makerFeeRate: "0.001",
          takerFeeRate: "0.002",
        },
      }),
    ),
  );

  // 2. Users + wallets
  const users = await Promise.all(
    TRADERS.map(async (t) => {
      const user = await prisma.user.upsert({
        where: { email: t.email },
        update: { name: t.name },
        create: { name: t.name, email: t.email },
      });
      await prisma.wallet.upsert({
        where: { address: t.wallet },
        update: {},
        create: { address: t.wallet, userId: user.id },
      });
      return user;
    }),
  );

  // 3. Drop fake protection rows over the past 7 days, weighted per user
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  let inserted = 0;

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx]!;
    const weight = WEIGHT[userIdx] ?? 1;
    const numRows = 8 + weight * 6; // alice ~38 rows, dave/erin ~14

    for (let i = 0; i < numRows; i++) {
      const market = markets[i % markets.length]!;
      const marketPrice = MARKETS[i % MARKETS.length]!.price;
      const reason = REASONS[i % REASONS.length]!;
      const ageMs = Math.random() * sevenDaysMs;
      const createdAt = new Date(now - ageMs);
      const size = 0.5 + Math.random() * (weight * 5); // bigger users → bigger sizes
      const deviation = 0.005 + Math.random() * 0.06; // 0.5% – 6.5%
      const quoteAge = Math.floor(Math.random() * 2500);

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          marketId: market.id,
          side: i % 2 === 0 ? "BUY" : "SELL",
          type: "LIMIT",
          status: "CANCELLED",
          price: marketPrice * (1 + (Math.random() - 0.5) * 0.1),
          size,
          remainingSize: 0,
          createdAt,
          updatedAt: createdAt,
        },
      });

      await prisma.protectionDecisions.create({
        data: {
          takerOrderId: order.id,
          orderId: order.id,
          marketId: market.id,
          decision: "CANCEL",
          reason,
          priceDeviation: deviation,
          quotePrice: marketPrice,
          quoteAgeMs: quoteAge,
          createdAt,
          updatedAt: createdAt,
        },
      });
      inserted += 1;
    }
  }

  console.log(`Seeded ${inserted} protection rows across ${users.length} traders and ${markets.length} markets.`);
  console.log("Open http://localhost:3002 to see the leaderboard populated.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
