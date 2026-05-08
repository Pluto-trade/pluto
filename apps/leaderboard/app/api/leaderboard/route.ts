import { NextResponse } from "next/server";
import { fetchLeaderboard, windowToHours } from "../../../lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const windowHours = windowToHours(searchParams.get("window") ?? "7d");
  const limit = Math.max(1, Math.min(500, Number(searchParams.get("limit") ?? 50)));
  try {
    const data = await fetchLeaderboard(windowHours, limit);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/leaderboard]", err);
    return NextResponse.json(
      { error: "failed to load leaderboard" },
      { status: 500 },
    );
  }
}
