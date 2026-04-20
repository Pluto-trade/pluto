import type { MpeMetrics } from "./types.js";

/**
 * In-memory metrics store.
 */
export function createMetrics(): MpeMetrics {
  return {
    totalOrders: 0,
    cancelledOrders: 0,
    cancelRate: 0,
    cancellationReasons: {},
  };
}

/**
 * Records a single evaluation outcome into the metrics store.
 * Pure mutation on the passed object (no global state in rules).
 */
export function recordMetric(
  metrics: MpeMetrics,
  decision: "ALLOW" | "CANCEL",
  reason: string
): void {
  metrics.totalOrders += 1;

  if (decision === "CANCEL") {
    metrics.cancelledOrders += 1;
    // Use the leading rule name as the bucket key (e.g. "DEVIATION", "DELAY")
    const bucket = reason.split(":")[0]?.trim() ?? "UNKNOWN";
    metrics.cancellationReasons[bucket] =
      (metrics.cancellationReasons[bucket] ?? 0) + 1;
  }

  metrics.cancelRate =
    metrics.totalOrders > 0
      ? metrics.cancelledOrders / metrics.totalOrders
      : 0;
}

/**
 * Pretty-prints a metrics summary to stdout.
 */
export function printMetrics(metrics: MpeMetrics): void {
  console.log("\n MPE Metrics ");
  console.log(`  Total orders   : ${metrics.totalOrders}`);
  console.log(`  Cancelled      : ${metrics.cancelledOrders}`);
  console.log(`  Cancel rate    : ${(metrics.cancelRate * 100).toFixed(2)}%`);
  console.log("  Reasons:");
  for (const [reason, count] of Object.entries(metrics.cancellationReasons)) {
    console.log(`    ${reason.padEnd(28)}: ${count}`);
  }
  console.log("═════════════════════════════════\n");
}
