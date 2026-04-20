import type { MpeContext, RuleResult } from "../types.js";
import { MPE_CONFIG } from "../config.js";

export function strongStaleRule(ctx: MpeContext): RuleResult {
  if (ctx.deviation > MPE_CONFIG.STRONG_STALE_DEVIATION) {
    return {
      passed: false,
      reason: `STRONG_STALE: deviation ${(ctx.deviation * 100).toFixed(3)}% exceeds hard limit ${(MPE_CONFIG.STRONG_STALE_DEVIATION * 100).toFixed(2)}% — immediate cancel`,
    };
  }
  return { passed: true, reason: "" };
}


/**
 * Strong Stale Rule
 * Hard cancels immediately if deviation exceeds 3% — highest risk signal.
 * This rule runs before all others in the engine.
 */
