import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.server";
import { supabaseAdmin } from "@/lib/supabase.server";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const params = body.params;
    if (!params)
      return NextResponse.json({ error: "params required" }, { status: 400 });

    // Upsert params for this user (avoid creating duplicate rows by using onConflict)
    const { data, error } = await supabaseAdmin
      .from("srs_params")
      .upsert({ user_id: user.id, params }, { onConflict: "user_id" })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: data ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
