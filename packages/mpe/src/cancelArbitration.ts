import type { FillRecord, CancelRequest, ArbitrationResult } from "./types.js";
import { MPE_CONFIG } from "./config.js";


export function arbitrateCancelGrace(
  fill: FillRecord,
  cancel: CancelRequest
): ArbitrationResult {
  const cancelDelay = cancel.cancelSentAt - fill.fillTime;
  const marketMove =
    Math.abs(cancel.currentOraclePrice - fill.oraclePriceAtFill) /
    fill.oraclePriceAtFill;

  //  Hard deadline 
  // If cancel arrives absurdly late, the window is closed unconditionally.
  if (cancelDelay > MPE_CONFIG.MAX_CANCEL_DELAY_MS) {
    return {
      verdict: "TAKER_KEEPS",
      reason: `Cancel arrived ${cancelDelay}ms after fill — exceeds hard deadline of ${MPE_CONFIG.MAX_CANCEL_DELAY_MS}ms. Taker keeps the position.`,
      cancelDelay,
      marketMove,
    };
  }

  //   Fast cancel — always protect the maker 
  if (cancelDelay <= MPE_CONFIG.CANCEL_GRACE_WINDOW_MS) {
    return {
      verdict: "PROTECT_MAKER",
      reason: `Cancel arrived ${cancelDelay}ms after fill — within grace window of ${MPE_CONFIG.CANCEL_GRACE_WINDOW_MS}ms. Maker intent was clear. Fill voided.`,
      cancelDelay,
      marketMove,
    };
  }

  //   Slow cancel — check if market moved 
  if (marketMove >= MPE_CONFIG.MARKET_MOVE_THRESHOLD) {
    return {
      verdict: "PROTECT_MAKER",
      reason: `Cancel was slow (${cancelDelay}ms) but oracle moved ${(marketMove * 100).toFixed(3)}% — exceeds ${(MPE_CONFIG.MARKET_MOVE_THRESHOLD * 100).toFixed(2)}% threshold. Fill likely exploitative. Maker protected.`,
      cancelDelay,
      marketMove,
    };
  }

  //  Slow cancel + fair market → taker earned it 
  return {
    verdict: "TAKER_KEEPS",
    reason: `Cancel arrived ${cancelDelay}ms after fill and oracle only moved ${(marketMove * 100).toFixed(3)}% — market was fair. Taker keeps the position.`,
    cancelDelay,
    marketMove,
  };
}
/**
 * Cancel Grace Window Arbitration
 *
 * Called AFTER a fill has already executed, when a maker sends a cancel.
 * Decides whether to PROTECT_MAKER (reverse/void the fill) or let TAKER_KEEPS it.
 *
 * Three rules in priority order:
 *
 *  1. Hard deadline — if cancel is way too late, taker keeps it regardless.
 *
 *  2. Fast cancel (cancelDelay <= CANCEL_GRACE_WINDOW_MS)
 *     → PROTECT_MAKER always.
 *     Maker reacted in human time. MEV bots fill in <10ms; 2s cancel
 *  3. Slow cancel + market didn't move
 *     → TAKER_KEEPS.
 *     Order sat there, price was fair, taker took a real position.
 *  4. Slow cancel + market moved a lot
 *     → PROTECT_MAKER.
 *     The fill only happened *because* price moved (stale order exploitation).
 *     The market move is evidence of a bot attack, not normal trading.
 *
 * Pure function 
 */