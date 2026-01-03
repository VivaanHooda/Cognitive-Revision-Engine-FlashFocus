import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/gemini.server";
import { getUserFromRequest } from "@/lib/auth.server";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { question, correctAnswer, userAnswer } = await req.json();
    if (!question || !correctAnswer || !userAnswer)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );

    const result = await evaluateAnswer(question, correctAnswer, userAnswer);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
