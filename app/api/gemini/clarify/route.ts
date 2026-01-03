import { NextResponse } from "next/server";
import { askCardClarification } from "@/lib/gemini.server";

export async function POST(req: Request) {
  try {
    const { question, cardFront, cardBack, history } = await req.json();
    if (!question || !cardFront || !cardBack)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );

    const answer = await askCardClarification(
      question,
      cardFront,
      cardBack,
      history || []
    );
    return NextResponse.json({ answer });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
