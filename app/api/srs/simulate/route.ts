import { NextResponse } from "next/server";
import { calculateNextReview, predictInterval } from "@/lib/srs.server";
import { getUserFromRequest } from "@/lib/auth.server";

const GRADES = ["again", "hard", "good", "easy"] as const;

export async function POST(req: Request) {
  try {
    // Allow unauthenticated simulation (useful for guest users) — auth optional
    const user = await getUserFromRequest(req).catch(() => null);

    const body = await req.json();
    const { card } = body;

    if (!card) {
      return NextResponse.json({ error: "card is required" }, { status: 400 });
    }

    // Fetch per-user params once
    const { supabaseAdmin } = await import("@/lib/supabase.server");
    const { data: paramsRow } = await supabaseAdmin
      .from("srs_params")
      .select("params")
      .eq("user_id", user?.id ?? "")
      .maybeSingle() as { data: { params: any } | null };
    const params = paramsRow?.params;

    const out: Record<
      string,
      { days: number; label: string; stability?: number; difficulty?: number }
    > = {};

    const TARGET: Record<(typeof GRADES)[number], number> = {
      again: 0.5,
      // Hard should schedule sooner (higher target retrievability), easy can be further out
      hard: 0.95,
      good: 0.9,
      easy: 0.85,
    };

    for (const g of GRADES) {
      // Run the same calculation that grading would use, but pass grade-specific target so stability and interval are consistent
      const r = calculateNextReview(card, g as any, params, TARGET[g]);
      const stability = (r as any).stability as number | undefined;
      const difficulty = (r as any).difficulty as number | undefined;
      if (g === "again") {
        out[g] = { days: 0, label: "< 1d", stability, difficulty };
        continue;
      }

      let floatDays: number;
      if (typeof stability === "number") {
        floatDays = predictInterval(stability, TARGET[g]);
      } else {
        floatDays = (r.interval as number) || 0;
      }

      const label = floatDays < 1 ? "< 1d" : `${floatDays.toFixed(1)}d`;
      out[g] = { days: floatDays, label, stability, difficulty };
    }

    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
