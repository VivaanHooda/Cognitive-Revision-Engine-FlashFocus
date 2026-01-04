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
      .single()
      .maybeSingle();

    const params = paramsRow?.params;
    const result = calculateNextReview(card, grade, params);

    // Return updated stats (server may also persist them via separate /api/cards call)
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
