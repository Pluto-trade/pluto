import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DollarSign, ShieldCheck, Clock } from "lucide-react";
import { Stat } from "../../../components/ui/Stat";
import { TraderReasonChart } from "../../../components/traders/TraderReasonChart";
import { MarketBar } from "../../../components/traders/MarketBar";
import { RecentTable } from "../../../components/traders/RecentTable";
import { WindowSwitch } from "../../../components/leaderboard/WindowSwitch";
import { fetchTraderProfile, windowToHours } from "../../../lib/leaderboard";
import { formatNumber, formatUsd } from "../../../lib/format";

export const revalidate = 30;

export default async function TraderProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ window?: string }>;
}) {
  const { userId } = await params;
  const sp = await searchParams;
  const windowKey = sp.window === "24h" || sp.window === "30d" ? sp.window : "7d";
  const windowHours = windowToHours(windowKey);
  const profile = await fetchTraderProfile(userId, windowHours);
  if (!profile) notFound();

  const multiple = profile.multipleOfMedian;
  const multipleHint =
    multiple > 0
      ? `${multiple.toFixed(1)}× the median trader this week`
      : "first protection event for this trader";

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <Link
        href={{ pathname: "/", query: { window: windowKey } }}
        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[var(--color-fg-muted)] transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to leaderboard
      </Link>

      <header className="mt-4 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-cyan)]">
            <ShieldCheck size={14} />
            Trader profile
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {profile.displayName}
          </h1>
          <p className="mt-1 font-mono text-xs text-[var(--color-fg-muted)]">
            {profile.walletShort ?? profile.userId}
          </p>
        </div>
        <WindowSwitch basePath={`/traders/${profile.userId}`} current={windowKey} />
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Saved"
          tone="positive"
          icon={<DollarSign size={16} />}
          value={formatUsd(profile.savedUsd, { compact: true })}
          hint={multipleHint}
        />
        <Stat
          label="Protections"
          tone="info"
          icon={<ShieldCheck size={16} />}
          value={formatNumber(profile.totalProtections)}
          hint={`Last ${windowKey}`}
        />
        <Stat
          label="Stale cancels"
          tone="warn"
          icon={<Clock size={16} />}
          value={formatNumber(profile.staleCancels)}
          hint="STRONG_STALE + DELAY"
        />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MarketBar data={profile.byMarket} />
        <TraderReasonChart byReason={profile.byReason} />
      </section>

      <section>
        <RecentTable rows={profile.recent} />
      </section>
    </main>
  );
}
