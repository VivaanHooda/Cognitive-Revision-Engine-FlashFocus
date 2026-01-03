import { NextResponse } from "next/server";
import { calculateNextReview } from "@/lib/srs.server";

const GRADES = ["again", "hard", "good", "easy"] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { card } = body;

    if (!card) {
      return NextResponse.json({ error: "card is required" }, { status: 400 });
    }

    const out: Record<string, string> = {};

    for (const g of GRADES) {
      const r = calculateNextReview(card, g as any);
      const d = r.interval || 0;
      out[g] = g === "again" ? "< 1d" : d === 0 ? "< 1d" : `${d}d`;
    }

    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
