import { NextResponse } from "next/server";
import { generateCurriculum } from "@/lib/gemini.server";
import { getUserFromRequest } from "@/lib/auth.server";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
