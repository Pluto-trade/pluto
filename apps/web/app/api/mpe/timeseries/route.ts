import { NextResponse } from "next/server";
import { fetchTimeseries } from "../../../../lib/mpe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const windowHours = Math.max(
    1,
    Math.min(24 * 30, Number(searchParams.get("windowHours") ?? 24)),
  );
  const bucketMinutes = Math.max(
    5,
    Math.min(60 * 24, Number(searchParams.get("bucketMinutes") ?? 60)),
  );
  try {
    const points = await fetchTimeseries(windowHours, bucketMinutes);
    return NextResponse.json({ points });
  } catch (err) {
    console.error("[/api/mpe/timeseries]", err);
    return NextResponse.json(
      { error: "failed to load timeseries" },
      { status: 500 },
    );
  }
}
