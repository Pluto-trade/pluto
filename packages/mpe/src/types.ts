//  Inputs 

export interface Order {
  id?: string;
  price: number;
  side: "buy" | "sell";
  timestamp: number; // ms epoch
}

export interface Market {
  oraclePrice: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  currentTime: number; // ms epoch
}

//  Derived context (computed by ContextBuilder) 

export type MarketRegime = "NORMAL" | "HIGH_VOL";

export interface MpeContext {
  order: Order;
  market: Market;
  // derived
  spread: number;
  midPrice: number;
  deviation: number;
  distanceFromMid: number;
  delay: number;
  volatility: number;
  regime: MarketRegime;
}

//  Rule result  

export type Decision = "ALLOW" | "CANCEL";

export interface RuleResult {
  passed: boolean;
  reason: string; // empty string when passed
}

//  Final engine output  

export interface MpeDecision {
  decision: Decision;
  reason: string;
}

//   Metrics snapshot   

export interface MpeMetrics {
  totalOrders: number;
  cancelledOrders: number;
  cancelRate: number; // 0-1
  cancellationReasons: Record<string, number>; // reason → count
}

// Cancel Grace Window types

/**
 * Snapshot of the fill that already executed.
 * Caller must capture oraclePrice at the moment the fill committed.
 */
export interface FillRecord {
  orderId: string;
  fillPrice: number;
  fillTime: number;           // ms epoch — when the fill was committed
  oraclePriceAtFill: number;  // oracle snapshot at fill time
}

/**
 * The cancel request arriving post-fill.
 */
export interface CancelRequest {
  orderId: string;
  cancelSentAt: number;         // ms epoch — when maker sent the cancel
  currentOraclePrice: number;   // oracle snapshot when cancel arrives
}

/** Outcome of the cancel grace window arbitration */
export type ArbitrationVerdict = "PROTECT_MAKER" | "TAKER_KEEPS";

export interface ArbitrationResult {
  verdict: ArbitrationVerdict;
  reason: string;
  cancelDelay: number;   // ms between fill and cancel arriving
  marketMove: number;    // fraction: |oracle_now - oracle_at_fill| / oracle_at_fill
}
