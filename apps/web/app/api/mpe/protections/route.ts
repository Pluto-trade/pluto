import { NextResponse } from "next/server";
import { fetchRecentProtections } from "../../../../lib/mpe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.max(
    1,
    Math.min(500, Number(searchParams.get("limit") ?? 50)),
  );
  try {
    const rows = await fetchRecentProtections(limit);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[/api/mpe/protections]", err);
    return NextResponse.json(
      { error: "failed to load protections" },
      { status: 500 },
    );
  }
}
