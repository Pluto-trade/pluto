/**
 * Deviation Rule
 * Cancels if price deviates from oracle by more than 2%.
 * Under high volatility the threshold tightens to 1%.
 */

import type { MpeContext, RuleResult } from "../types.js";
import { MPE_CONFIG } from "../config.js";

export function deviationRule(ctx: MpeContext): RuleResult {
  const threshold =
    ctx.regime === "HIGH_VOL"
      ? MPE_CONFIG.VOLATILE_MAX_DEVIATION
      : MPE_CONFIG.MAX_DEVIATION;

  if (ctx.deviation > threshold) {
    return {
      passed: false,
      reason: `DEVIATION${ctx.regime === "HIGH_VOL" ? " [HIGH_VOL]" : ""}: ${(ctx.deviation * 100).toFixed(3)}% > threshold ${(threshold * 100).toFixed(2)}%`,
    };
  }
  return { passed: true, reason: "" };
}
