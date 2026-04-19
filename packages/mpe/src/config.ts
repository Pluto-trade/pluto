// Configuration constants for the MPE rules

export const MPE_CONFIG = {
  /**
   * Maximum age (ms) a price sample can be before it is considered stale.
   * Default: 30 seconds
   */
  STALE_PRICE_MAX_AGE_MS: 30_000,

  /**
   * Maximum acceptable spread percentage (bid-ask / mid * 100).
   * Default: 0.5%
   */
  MAX_SPREAD_PCT: 0.5,

  /**
   * Maximum processing delay (ms) allowed between price receipt and evaluation.
   * Default: 5 seconds
   */
  MAX_DELAY_MS: 5_000,
} as const;

export type MpeConfig = typeof MPE_CONFIG;
