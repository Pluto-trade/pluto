import { describe, it, expect } from "vitest";
import { evaluate } from "../src/engine.js";
import { buildContext } from "../src/contextBuilder.js";
import { arbitrateCancelGrace } from "../src/cancelArbitration.js";
import { MPE_CONFIG } from "../src/config.js";
import type { Order, Market, FillRecord, CancelRequest } from "../src/types.js";

//   Fixtures   

const NOW = 1_700_000_000_000;

const baseMarket: Market = {
  oraclePrice: 100,
  lastTradePrice: 100,
  bestBid: 99.9,
  bestAsk: 100.1,
  currentTime: NOW,
};

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    price: 100,
    side: "buy",
    timestamp: NOW - 500,
    ...overrides,
  };
}

function market(overrides: Partial<Market> = {}): Market {
  return { ...baseMarket, ...overrides };
}

//   Happy path  

describe("Happy path", () => {
  it("ALLOWs a clean order", () => {
    const result = evaluate(order(), market());
    expect(result.decision).toBe("ALLOW");
    expect(result.reason).toBe("");
  });
});

//   Strong Stale rule   

describe("strongStaleRule", () => {
  it("CANCELs when deviation > 3%", () => {
    const result = evaluate(
      order({ price: 104 }),
      market({ oraclePrice: 100, bestBid: 103.9, bestAsk: 104.1 })
    );
    expect(result.decision).toBe("CANCEL");
    expect(result.reason).toContain("STRONG_STALE");
  });
});

//   Deviation rule   

describe("deviationRule", () => {
  it("CANCELs when deviation > 2%", () => {
    const result = evaluate(
      order({ price: 102.5 }),
      market({ oraclePrice: 100, bestBid: 102.4, bestAsk: 102.6 })
    );
    expect(result.decision).toBe("CANCEL");
    expect(result.reason).toContain("DEVIATION");
  });

  it("ALLOWs when deviation is exactly 2% (not strictly greater)", () => {
    const result = evaluate(
      order({ price: 102 }),
      market({ oraclePrice: 100, bestBid: 101.9, bestAsk: 102.1 })
    );
    expect(result.decision).toBe("ALLOW");
  });

  it("uses tighter 1% threshold under high volatility", () => {
    const result = evaluate(
      order({ price: 101.5 }),
      market({ oraclePrice: 100, lastTradePrice: 106, bestBid: 101.4, bestAsk: 101.6 })
    );
    expect(result.decision).toBe("CANCEL");
    expect(result.reason).toMatch(/DEVIATION|VOLATILITY_GUARD/);
  });
});

//   Delay rule   

describe("delayRule", () => {
  it("CANCELs when order is older than 5000ms", () => {
    const result = evaluate(order({ timestamp: NOW - 6_000 }), market());
    expect(result.decision).toBe("CANCEL");
    expect(result.reason).toContain("DELAY");
  });

  it("ALLOWs a fresh order", () => {
    const result = evaluate(order({ timestamp: NOW - 100 }), market());
    expect(result.decision).toBe("ALLOW");
  });

  it("uses 2500ms threshold under high volatility", () => {
    const result = evaluate(
      order({ timestamp: NOW - 3_000 }),
      market({ lastTradePrice: 106 })
    );
    expect(result.decision).toBe("CANCEL");
  });
});

//   Context Builder  

describe("buildContext", () => {
  it("computes all derived fields correctly", () => {
    const o = order({ price: 100, timestamp: NOW - 2_000 });
    const m = market({ bestBid: 99, bestAsk: 101, oraclePrice: 100, lastTradePrice: 103 });
    const ctx = buildContext(o, m);

    expect(ctx.spread).toBeCloseTo(2, 5);
    expect(ctx.midPrice).toBeCloseTo(100, 5);
    expect(ctx.deviation).toBeCloseTo(0, 5);
    expect(ctx.delay).toBe(2_000);
    expect(ctx.volatility).toBeCloseTo(0.03, 5);
  });
});

//   Cancel Grace Window  

const FILL_TIME = NOW;
const ORACLE_AT_FILL = 100;

function fill(overrides: Partial<FillRecord> = {}): FillRecord {
  return {
    orderId: "ord-1",
    fillPrice: 100,
    fillTime: FILL_TIME,
    oraclePriceAtFill: ORACLE_AT_FILL,
    ...overrides,
  };
}

function cancel(overrides: Partial<CancelRequest> = {}): CancelRequest {
  return {
    orderId: "ord-1",
    cancelSentAt: FILL_TIME + 1_000, // 1s after fill (fast)
    currentOraclePrice: ORACLE_AT_FILL, // market didn't move
    ...overrides,
  };
}

describe("Cancel Grace Window", () => {
  //  Rule 1: Fast cancel   

  it("PROTECT_MAKER when cancel is within grace window (fast cancel, no market move)", () => {
    const result = arbitrateCancelGrace(
      fill(),
      cancel({ cancelSentAt: FILL_TIME + 500 }) // 500ms — well within 2000ms
    );
    expect(result.verdict).toBe("PROTECT_MAKER");
    expect(result.cancelDelay).toBe(500);
  });

  it("PROTECT_MAKER when cancel is within grace window even if market moved a lot", () => {
    // Even with big market move, fast cancel always protects maker
    const result = arbitrateCancelGrace(
      fill(),
      cancel({
        cancelSentAt: FILL_TIME + 1_800, // still within 2000ms
        currentOraclePrice: 110,          // 10% move — irrelevant for fast cancel
      })
    );
    expect(result.verdict).toBe("PROTECT_MAKER");
  });

  it("PROTECT_MAKER at exactly the grace window boundary (edge case)", () => {
    const result = arbitrateCancelGrace(
      fill(),
      cancel({ cancelSentAt: FILL_TIME + MPE_CONFIG.CANCEL_GRACE_WINDOW_MS })
    );
    // <= boundary → still protected
    expect(result.verdict).toBe("PROTECT_MAKER");
  });

  //   Rule 2: Slow cancel + market didn't move    

  it("TAKER_KEEPS when cancel is slow and market was stable", () => {
    const result = arbitrateCancelGrace(
      fill(),
      cancel({
        cancelSentAt: FILL_TIME + 4_000,   // 4s — beyond grace window
        currentOraclePrice: 100.5,          // 0.5% move — below 1% threshold
      })
    );
    expect(result.verdict).toBe("TAKER_KEEPS");
    expect(result.marketMove).toBeLessThan(MPE_CONFIG.MARKET_MOVE_THRESHOLD);
  });

  //  Rule 3: Slow cancel + market moved → protect maker  

  it("PROTECT_MAKER when cancel is slow but oracle moved > 1%", () => {
    const result = arbitrateCancelGrace(
      fill(),
      cancel({
        cancelSentAt: FILL_TIME + 4_000,  // slow cancel
        currentOraclePrice: 102,           // 2% move — above 1% threshold
      })
    );
    expect(result.verdict).toBe("PROTECT_MAKER");
    expect(result.marketMove).toBeGreaterThanOrEqual(MPE_CONFIG.MARKET_MOVE_THRESHOLD);
  });

  //  Hard deadline 

  it("TAKER_KEEPS when cancel exceeds hard deadline even with big market move", () => {
    const result = arbitrateCancelGrace(
      fill(),
      cancel({
        cancelSentAt: FILL_TIME + 15_000, // 15s — beyond MAX_CANCEL_DELAY_MS (10s)
        currentOraclePrice: 120,           // big move — but too late
      })
    );
    expect(result.verdict).toBe("TAKER_KEEPS");
    expect(result.cancelDelay).toBeGreaterThan(MPE_CONFIG.MAX_CANCEL_DELAY_MS);
  });

  //  Result shape 

  it("always returns cancelDelay and marketMove in result", () => {
    const result = arbitrateCancelGrace(fill(), cancel());
    expect(typeof result.cancelDelay).toBe("number");
    expect(typeof result.marketMove).toBe("number");
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  });
});
