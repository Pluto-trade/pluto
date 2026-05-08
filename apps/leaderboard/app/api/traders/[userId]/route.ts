import { NextResponse } from "next/server";
import { fetchTraderProfile, windowToHours } from "../../../../lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const windowHours = windowToHours(searchParams.get("window") ?? "7d");
  try {
    const profile = await fetchTraderProfile(userId, windowHours);
    if (!profile) {
      return NextResponse.json({ error: "trader not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (err) {
    console.error(`[/api/traders/${userId}]`, err);
    return NextResponse.json(
      { error: "failed to load trader profile" },
      { status: 500 },
    );
  }
}
