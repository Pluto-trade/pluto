import type { Order, Market, MpeDecision, MpeContext } from "./types.js";
import type { RuleResult } from "./types.js";
import { buildContext } from "./contextBuilder.js";
import { strongStaleRule } from "./rules/strongStale.js";
import { deviationRule } from "./rules/deviation.js";
import { delayRule } from "./rules/delay.js";
import { volatilityRule } from "./rules/volatility.js";

//  Rule registry 
// Order matters: strongStale is first for early-exit on the highest risk signal.
const RULES: Array<(ctx: MpeContext) => RuleResult> = [
  strongStaleRule,
  deviationRule,
  delayRule,
  volatilityRule,
];


/**
 * Evaluates an order against all MPE rules.
 * Short-circuits on the first failing rule.
 * Returns { decision, reason } — pure, deterministic, zero side effects.
 */
export function evaluate(order: Order, market: Market): MpeDecision {
  const ctx = buildContext(order, market);

  for (const rule of RULES) {
    const result = rule(ctx);
    if (!result.passed) {
      return { decision: "CANCEL", reason: result.reason };
    }
  }

  return { decision: "ALLOW", reason: "" };
}

/**
 * Same as evaluate but also returns the built context (useful for testing/logging).
 */
export function evaluateWithContext(
  order: Order,
  market: Market
): { decision: MpeDecision; context: MpeContext } {
  const ctx = buildContext(order, market);
  const decision = evaluate(order, market);
  return { decision, context: ctx };
}
