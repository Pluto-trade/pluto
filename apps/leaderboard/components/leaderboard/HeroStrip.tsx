import { DollarSign, ShieldCheck, Clock, Users } from "lucide-react";
import { Stat } from "../ui/Stat";
import { formatNumber, formatUsd } from "../../lib/format";
import type { GlobalStats } from "../../lib/leaderboard";

function reasonLabel(r: string) {
  return r
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function HeroStrip({ stats }: { stats: GlobalStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Total saved"
        tone="positive"
        icon={<DollarSign size={16} />}
        value={formatUsd(stats.totalSavedUsd, { compact: true })}
        hint={`Across ${formatNumber(stats.totalProtections)} protections`}
      />
      <Stat
        label="Stale cancels"
        tone="info"
        icon={<Clock size={16} />}
        value={formatNumber(stats.staleCancels)}
        hint="STRONG_STALE + DELAY"
      />
      <Stat
        label="Top reason"
        tone="warn"
        icon={<ShieldCheck size={16} />}
        value={
          <span className="text-2xl">
            {stats.topReason ? reasonLabel(stats.topReason.reason) : "—"}
          </span>
        }
        hint={
          stats.topReason
            ? `${formatNumber(stats.topReason.count)} events`
            : "no decisions in window"
        }
      />
      <Stat
        label="Unique traders"
        icon={<Users size={16} />}
        value={formatNumber(stats.uniqueTraders)}
        hint="Protected at least once"
      />
    </div>
  );
}
