
// All numeric thresholds for MPE rules.

export const MPE_CONFIG = {
  // Deviation rule
  /** Max allowed |price - oracle| / oracle before CANCEL */
  MAX_DEVIATION: 0.02,

  // Strong stale rule
  /** Hard ceiling — cancel immediately regardless of other rules */
  STRONG_STALE_DEVIATION: 0.03,

  // Delay rule
  /** Max order age in ms */
  MAX_DELAY_MS: 5_000,

  // Volatility rule — adaptive thresholds
  /** Volatility level that triggers tighter thresholds */
  VOLATILITY_THRESHOLD: 0.05,
  /** Tighter deviation threshold under high volatility */
  VOLATILE_MAX_DEVIATION: 0.01,
  /** Tighter delay threshold under high volatility (ms) */
  VOLATILE_MAX_DELAY_MS: 2_500,

  // Cancel Grace Window
  /**
   * If cancel arrives within this many ms of the fill, maker is ALWAYS protected.
   * Represents "fast cancel" — maker reacted in human time.
   */
  CANCEL_GRACE_WINDOW_MS: 2_000,
  /**
   * If oracle moved more than this fraction between fill and cancel,
   * the fill is considered exploitative even if cancel was slow.
   */
  MARKET_MOVE_THRESHOLD: 0.01,
  /**
   * Hard cap: beyond this delay the maker is never protected,
   * even if the market moved.
   */
  MAX_CANCEL_DELAY_MS: 10_000,
} as const;

export type MpeConfig = typeof MPE_CONFIG;
