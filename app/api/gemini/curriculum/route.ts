import { NextResponse } from "next/server";
import { generateCurriculum } from "@/lib/gemini.server";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic)
      return NextResponse.json({ error: "Missing topic" }, { status: 400 });

    const subtopics = await generateCurriculum(topic);
    return NextResponse.json({ subtopics });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
