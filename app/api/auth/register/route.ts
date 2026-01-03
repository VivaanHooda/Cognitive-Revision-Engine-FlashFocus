import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";

export async function POST(req: Request) {
  try {
    const { username, password, name } = await req.json();
    if (!username || !password)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );

    // Create user via Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: username,
      password,
      user_metadata: { name },
      email_confirm: true,
    } as any);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const created = data.user;
    const user = {
      id: created.id,
      email: created.email,
      name: (created.user_metadata as any)?.name || created.email,
    };
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
