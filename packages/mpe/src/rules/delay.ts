import type { MarketSnapshot, RuleViolation } from "../types.js";
import { MPE_CONFIG } from "../config.js";

/**
 * Checks whether the delay between the price timestamp and now
 * is within acceptable bounds, flagging processing lag.
 */
export function checkDelay(snapshot: MarketSnapshot): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const delayMs = Date.now() - snapshot.latestPrice.timestamp;

  if (delayMs > MPE_CONFIG.MAX_DELAY_MS) {
    violations.push({
      rule: "delay",
      severity: "warn",
      message: `Processing delay of ${delayMs}ms exceeds max ${MPE_CONFIG.MAX_DELAY_MS}ms for "${snapshot.symbol}".`,
    });
  }

  return violations;
}
