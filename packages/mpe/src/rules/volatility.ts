// Volatility = how fast price is changing
// In high volatility:
// orders become stale faster
// makers get picked off easily




import type { MpeContext, RuleResult } from "../types.js";
import { MPE_CONFIG } from "../config.js";

/**
 * Volatility Guard Rule
 */
export function volatilityRule(ctx: MpeContext): RuleResult {
  if (ctx.volatility <= MPE_CONFIG.VOLATILITY_THRESHOLD) {
    return { passed: true, reason: "" };
  }

  // Under high volatility, re-check deviation with tight threshold
  if (ctx.deviation > MPE_CONFIG.VOLATILE_MAX_DEVIATION) {
    return {
      passed: false,
      reason: `VOLATILITY_GUARD: high volatility (${(ctx.volatility * 100).toFixed(2)}%) → deviation ${(ctx.deviation * 100).toFixed(3)}% > ${(MPE_CONFIG.VOLATILE_MAX_DEVIATION * 100).toFixed(2)}%`,
    };
  }

  // Under high volatility, tighter delay
  if (ctx.delay > MPE_CONFIG.VOLATILE_MAX_DELAY_MS) {
    return {
      passed: false,
      reason: `VOLATILITY_GUARD: high volatility (${(ctx.volatility * 100).toFixed(2)}%) → delay ${ctx.delay}ms > ${MPE_CONFIG.VOLATILE_MAX_DELAY_MS}ms`,
    };
  }

  return { passed: true, reason: "" };
}