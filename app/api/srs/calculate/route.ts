import { NextResponse } from "next/server";
import { calculateNextReview } from "@/lib/srs.server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { card, grade } = body;

    if (!card || !grade) {
      return NextResponse.json(
        { error: "card and grade are required" },
        { status: 400 }
      );
    }

    const result = calculateNextReview(card, grade);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
