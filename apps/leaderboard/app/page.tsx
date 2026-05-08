import { HeroStrip } from "../components/leaderboard/HeroStrip";
import { TopSavingsChart } from "../components/leaderboard/TopSavingsChart";
import { ReasonChart } from "../components/leaderboard/ReasonChart";
import { TraderTable } from "../components/leaderboard/TraderTable";
import { WindowSwitch } from "../components/leaderboard/WindowSwitch";
import { LivePill } from "../components/LivePill";
import { fetchLeaderboard, windowToHours } from "../lib/leaderboard";

export const revalidate = 60;

const WINDOW_LABEL: Record<string, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const params = await searchParams;
  const windowKey =
    params.window === "24h" || params.window === "30d" ? params.window : "7d";
  const windowHours = windowToHours(windowKey);
  const { global, rows } = await fetchLeaderboard(windowHours, 50);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 sm:py-16">
      <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-5">
          <LivePill>Live · {WINDOW_LABEL[windowKey]}</LivePill>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tighter sm:text-6xl">
            <span className="grad-cyan">Top traders</span>
            <br />
            <span className="text-white/95">protected by MPE</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--color-fg-muted)] sm:text-[15px]">
            Ranked by estimated USD that the Matching Pre-Engine rescued from
            bad fills — stale quotes, deviation cancels, and high-volatility
            delays. Click any trader to see their protection profile.
          </p>
        </div>
        <WindowSwitch basePath="/" current={windowKey} />
      </header>

      <section className="mb-8">
        <HeroStrip stats={global} />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopSavingsChart rows={rows} />
        </div>
        <ReasonChart stats={global} />
      </section>

      <section>
        <TraderTable rows={rows} windowKey={windowKey} />
      </section>

      <footer className="mt-16 flex flex-col items-center gap-2 text-center text-[11px] text-[var(--color-fg-dim)]">
        <p className="max-w-md leading-relaxed">
          Estimated savings = |priceDeviation| × size × quotePrice on cancelled
          orders. USD only when the market quotes in USDC.
        </p>
        <p className="font-mono uppercase tracking-[0.18em]">
          Auto-refreshes every 60s · Plut0x MPE
        </p>
      </footer>
    </main>
  );
}
