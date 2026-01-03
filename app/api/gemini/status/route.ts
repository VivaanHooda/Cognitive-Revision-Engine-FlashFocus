import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true });
}
