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
    .single()
    .maybeSingle();
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

  // upsert
  const { data, error } = await supabaseAdmin
    .from("srs_params")
    .upsert({ user_id: user.id, params })
    .select();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data?.[0] ?? null);
}
