import type { Order, Market, MpeDecision, MpeContext } from "./types.js";
import type { RuleResult } from "./types.js";
import { buildContext } from "./contextBuilder.js";
import { strongStaleRule } from "./rules/strongStale.js";
import { deviationRule } from "./rules/deviation.js";
import { delayRule } from "./rules/delay.js";
import { volatilityRule } from "./rules/volatility.js";

const RULES: Array<(ctx: MpeContext) => RuleResult> = [
  strongStaleRule,
  deviationRule,
  delayRule,
  volatilityRule,
];


export function evaluateWithContext(
  order: Order,
  market: Market
): { decision: MpeDecision; context: MpeContext } {
  const ctx = buildContext(order, market);

  for (const rule of RULES) {
    const result = rule(ctx);
    if (!result.passed) {
      return { decision: { decision: "CANCEL", reason: result.reason }, context: ctx };
    }
  }

  return { decision: { decision: "ALLOW", reason: "" }, context: ctx };
}

export function evaluate(order: Order, market: Market): MpeDecision {
  return evaluateWithContext(order, market).decision;
}
