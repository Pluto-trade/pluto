import { NextResponse } from "next/server";
import { fetchStats } from "../../../../lib/mpe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const windowHours = Math.max(
    1,
    Math.min(24 * 30, Number(searchParams.get("windowHours") ?? 24)),
  );
  try {
    const stats = await fetchStats(windowHours);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[/api/mpe/stats]", err);
    return NextResponse.json(
      { error: "failed to load stats" },
      { status: 500 },
    );
  }
}
