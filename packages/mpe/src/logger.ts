import type { MpeDecision } from "./types.js";
import type { MpeContext } from "./types.js";

/**
 * Logs a single MPE evaluation to stdout.
 * Pure function.
 */
export function logDecision(ctx: MpeContext, result: MpeDecision): void {
  const entry = {
    timestamp: new Date(ctx.market.currentTime).toISOString(),
    orderId: ctx.order.id ?? "unknown",
    side: ctx.order.side,
    price: ctx.order.price,
    decision: result.decision,
    reason: result.reason || "all rules passed",
    deviation_pct: (ctx.deviation * 100).toFixed(4),
    delay_ms: ctx.delay,
    volatility_pct: (ctx.volatility * 100).toFixed(4),
  };

  console.log(JSON.stringify(entry));
}
