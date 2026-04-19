import type { MarketSnapshot, RuleViolation } from "../types.js";
import { MPE_CONFIG } from "../config.js";

/**
 * Checks whether the bid-ask spread is within acceptable limits.
 * A wide spread signals low liquidity or price manipulation risk.
 */
export function checkSpread(snapshot: MarketSnapshot): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const { spreadPct } = snapshot.spread;

  if (spreadPct > MPE_CONFIG.MAX_SPREAD_PCT) {
    violations.push({
      rule: "spread",
      severity: "error",
      message: `Spread of ${spreadPct.toFixed(4)}% exceeds max ${MPE_CONFIG.MAX_SPREAD_PCT}% for "${snapshot.symbol}".`,
    });
  }

  return violations;
}
