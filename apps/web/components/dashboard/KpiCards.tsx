import { Shield, ShieldOff, ShieldCheck, DollarSign } from "lucide-react";
import { Stat } from "../ui/Stat";
import { formatNumber, formatPercent, formatUsd } from "../../lib/format";
import type { MpeStats } from "../../lib/mpe";

export function KpiCards({ stats }: { stats: MpeStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Estimated saved"
        tone="positive"
        icon={<DollarSign size={16} />}
        value={formatUsd(stats.estimatedSavedUsd, { compact: true })}
        hint={`Across ${formatNumber(stats.cancelled)} cancelled orders`}
      />
      <Stat
        label="Protected orders"
        tone="info"
        icon={<ShieldCheck size={16} />}
        value={formatNumber(stats.cancelled)}
        hint={`${formatPercent(stats.protectionRate, 1)} protection rate`}
      />
      <Stat
        label="Decisions"
        icon={<Shield size={16} />}
        value={formatNumber(stats.totalDecisions)}
        hint={`Last ${stats.windowHours}h window`}
      />
      <Stat
        label="Allowed through"
        tone="warn"
        icon={<ShieldOff size={16} />}
        value={formatNumber(stats.allowed)}
        hint="Passed MPE checks"
      />
    </div>
  );
}
