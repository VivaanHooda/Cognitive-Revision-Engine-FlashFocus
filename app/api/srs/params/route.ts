import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";
import { getUserFromRequest } from "@/lib/auth.server";
import { DEFAULT_FSRS_PARAMS } from "@/lib/srs.server";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("srs_params")
    .select("params")
    .eq("user_id", user.id)
    .maybeSingle() as { data: { params: any } | null; error: any };
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data?.params ?? DEFAULT_FSRS_PARAMS);
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const params = body.params;
  if (!params)
    return NextResponse.json({ error: "params required" }, { status: 400 });

  // upsert (use onConflict to avoid duplicate rows)
  const { data, error } = await supabaseAdmin
    .from("srs_params")
    .upsert({ user_id: user.id, params } as any, { onConflict: "user_id" })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? null);
}
