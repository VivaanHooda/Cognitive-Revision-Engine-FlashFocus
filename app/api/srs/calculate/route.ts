import { NextResponse } from "next/server";
import { calculateNextReview } from "@/lib/srs.server";
import { getUserFromRequest } from "@/lib/auth.server";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { card, grade } = body;

    if (!card || !grade) {
      return NextResponse.json(
        { error: "card and grade are required" },
        { status: 400 }
      );
    }

    // Fetch per-user FSRS params and run calculation with them
    const { data: paramsRow } = await (
      await import("@/lib/supabase.server")
    ).supabaseAdmin
      .from("srs_params")
      .select("params")
      .eq("user_id", user.id)
      .maybeSingle() as { data: { params: any } | null };

    // Use stored params or defaults and run calculation
    const params =
      paramsRow?.params ??
      (await import("@/lib/srs.server")).DEFAULT_FSRS_PARAMS;

    const TARGET: Record<any, number> = {
      again: 0.5,
      hard: 0.95,
      good: 0.9,
      easy: 0.85,
    };

    const result = calculateNextReview(card, grade, params, TARGET[grade]);

    // Persist the (possibly-default) params back to the DB so every user has a params row
    // Always upsert to update the row and refreshed timestamps even if params are identical
    try {
      const { supabaseAdmin } = await import("@/lib/supabase.server");
      const { data: upserted, error: upsertErr } = await supabaseAdmin
        .from("srs_params")
        .upsert({ user_id: user.id, params } as any, { onConflict: "user_id" })
        .select()
        .single();
      if (upsertErr) console.error("Failed to persist SRS params:", upsertErr);
    } catch (err) {
      console.error("Error persisting SRS params:", err);
    }

    // Return updated stats and the params that were used/saved
    return NextResponse.json({ ...result, paramsSaved: true, params });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
