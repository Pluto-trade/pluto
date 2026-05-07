import { ShieldCheck } from "lucide-react";
import { KpiCards } from "../components/dashboard/KpiCards";
import { SavingsChart } from "../components/dashboard/SavingsChart";
import { DecisionsChart } from "../components/dashboard/DecisionsChart";
import { ReasonChart } from "../components/dashboard/ReasonChart";
import { ProtectionsTable } from "../components/dashboard/ProtectionsTable";
import {
  fetchRecentProtections,
  fetchStats,
  fetchTimeseries,
} from "../lib/mpe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WINDOW_HOURS = 24;
const BUCKET_MINUTES = 60;
const ROW_LIMIT = 50;

export default async function MpeDashboardPage() {
  const [stats, points, rows] = await Promise.all([
    fetchStats(WINDOW_HOURS),
    fetchTimeseries(WINDOW_HOURS, BUCKET_MINUTES),
    fetchRecentProtections(ROW_LIMIT),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-cyan)]">
          <ShieldCheck size={14} />
          Matching Pre-Engine
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          MPE Dashboard
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-fg-muted)]">
          Live view of every order MPE inspected. Tracks how many orders were
          protected from bad fills, the estimated USD value rescued, and why
          each decision was made — over the last {WINDOW_HOURS} hours.
        </p>
      </header>

      <section className="mb-6">
        <KpiCards stats={stats} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SavingsChart points={points} windowHours={WINDOW_HOURS} />
        </div>
        <ReasonChart stats={stats} />
      </section>

      <section className="mb-6">
        <DecisionsChart points={points} windowHours={WINDOW_HOURS} />
      </section>

      <section>
        <ProtectionsTable rows={rows} />
      </section>

      <footer className="mt-10 text-center text-xs text-[var(--color-fg-dim)]">
        Estimated savings = |priceDeviation| × size × quotePrice on cancelled
        orders. Quote asset assumed USD-pegged.
      </footer>
    </main>
  );
}
