import type { MpeContext, RuleResult } from "../types.js";
import { MPE_CONFIG } from "../config.js";

/**
 * Delay Rule
 * Cancels if the order is older than the max allowed delay.
 * Under high volatility the delay threshold is halved.
 */
export function delayRule(ctx: MpeContext): RuleResult {
  const threshold =
    ctx.regime === "HIGH_VOL"
      ? MPE_CONFIG.VOLATILE_MAX_DELAY_MS
      : MPE_CONFIG.MAX_DELAY_MS;

  if (ctx.delay > threshold) {
    return {
      passed: false,
      reason: `DELAY${ctx.regime === "HIGH_VOL" ? " [HIGH_VOL]" : ""}: ${ctx.delay}ms > threshold ${threshold}ms`,
    };
  }
  return { passed: true, reason: "" };
}
