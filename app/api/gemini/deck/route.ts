import { NextResponse } from "next/server";
import { generateDeckFromTopic } from "@/lib/gemini.server";
import { getUserFromRequest } from "@/lib/auth.server";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subtopic, parentTopic } = await req.json();
    if (!subtopic || !parentTopic)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );

    const deck = await generateDeckFromTopic(subtopic, parentTopic);
    return NextResponse.json(deck);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
