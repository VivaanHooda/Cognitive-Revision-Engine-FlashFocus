import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );

    // Sign in using Supabase (service client supports signInWithPassword)
    const {
      data: { session },
      error,
    } = await supabaseAdmin.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error || !session?.user)
      return NextResponse.json(
        { error: error?.message || "Invalid credentials" },
        { status: 401 }
      );

    const user = session.user;
    // Return session and user; client should store session via supabase-js
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: (user.user_metadata as any)?.name || user.email,
      },
      session,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
