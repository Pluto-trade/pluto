/**
 * Simulation Script
 * Runs N orders with random data through the engine and prints metrics.
 *
 * Usage:
 *   npx tsx scripts/simulate.ts
 *   npx tsx scripts/simulate.ts 500   
 */

import { evaluate, buildContext, logDecision, createMetrics, recordMetric, printMetrics } from "../src/index.js";
import type { Order, Market } from "../src/types.js";


function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randSide(): "buy" | "sell" {
  return Math.random() < 0.5 ? "buy" : "sell";
}

/** Generates a plausible random market */
function randomMarket(now: number): Market {
  const oraclePrice = rand(90, 110);
  // lastTradePrice can drift — occasionally spike volatility
  const lastTradePrice = oraclePrice * rand(0.93, 1.08);
  const spread = rand(0.1, 2.0);
  const midOffset = rand(-0.5, 0.5);
  const mid = oraclePrice + midOffset;

  return {
    oraclePrice,
    lastTradePrice,
    bestBid: mid - spread / 2,
    bestAsk: mid + spread / 2,
    currentTime: now,
  };
}

function randomOrder(market: Market, now: number): Order {
  // price randomly within ±8% of oracle — wide enough to hit all rules
  const price = market.oraclePrice * rand(0.92, 1.08);
  const delayMs = rand(0, 8_000);

  return {
    id: `ord-${Math.random().toString(36).slice(2, 9)}`,
    price,
    side: randSide(),
    timestamp: now - delayMs,
  };
}


const COUNT = parseInt(process.argv[2] ?? "200", 10);
const metrics = createMetrics();
const now = Date.now();

console.log(`\n Running MPE simulation with ${COUNT} random orders...\n`);

for (let i = 0; i < COUNT; i++) {
  const market = randomMarket(now);
  const order = randomOrder(market, now);
  const ctx = buildContext(order, market);
  const decision = evaluate(order, market);

  recordMetric(metrics, decision.decision, decision.reason);
  logDecision(ctx, decision);
}

printMetrics(metrics);
