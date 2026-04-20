// Public API — consumers import only from "@repo/mpe"

export { evaluate, evaluateWithContext } from "./engine.js";
export { buildContext } from "./contextBuilder.js";
export { arbitrateCancelGrace } from "./cancelArbitration.js";
export { logDecision } from "./logger.js";
export { createMetrics, recordMetric, printMetrics } from "./metrics.js";
export { MPE_CONFIG } from "./config.js";

export type {
  Order,
  Market,
  MpeContext,
  MpeDecision,
  Decision,
  RuleResult,
  MpeMetrics,
  FillRecord,
  CancelRequest,
  ArbitrationVerdict,
  ArbitrationResult,
} from "./types.js";
