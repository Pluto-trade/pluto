import type { MarketSnapshot, RuleViolation } from "../types.js";
import { MPE_CONFIG } from "../config.js";

/**
 * Checks whether the latest price sample is too old.
 * A stale price means we cannot trust the market data.
 */
export function checkStalePrice(snapshot: MarketSnapshot): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const ageMs = Date.now() - snapshot.latestPrice.timestamp;

  if (ageMs > MPE_CONFIG.STALE_PRICE_MAX_AGE_MS) {
    violations.push({
      rule: "stalePrice",
      severity: "error",
      message: `Price from "${snapshot.latestPrice.source}" is ${ageMs}ms old (max ${MPE_CONFIG.STALE_PRICE_MAX_AGE_MS}ms).`,
    });
  }

  return violations;
}
