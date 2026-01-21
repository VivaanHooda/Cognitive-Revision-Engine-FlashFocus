import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";
import { getUserFromRequest } from "@/lib/auth.server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  // Allow unauthenticated reads: return an empty list rather than 401 so client code doesn't throw
  if (!user) {
    console.log('[api/cards] No authenticated user found');
    return NextResponse.json([]);
  }

  const url = new URL(req.url);
  const deckId = url.searchParams.get("deckId");
  const dueOnly = url.searchParams.get("dueOnly") === "1";

  let builder = supabaseAdmin.from("cards").select("*").eq("user_id", user.id);
  if (deckId) builder = builder.eq("deck_id", deckId);
  if (dueOnly)
    builder = builder
      .not("due_date", "is", null)
      .lte("due_date", new Date().toISOString());
  builder = builder.order("due_date", { ascending: true });

  const { data, error } = await builder;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? [], {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const cards = Array.isArray(body) ? body : [body];
  const rows = cards.map((c: any) => ({
    id: c.id,
    deck_id: c.deckId || c.deck_id,
    user_id: user.id,
    front: c.front,
    back: c.back,
    status: c.status || "new",
    ease_factor: c.easeFactor ?? c.ease_factor ?? null,
    stability: c.stability ?? null,
    difficulty: c.difficulty ?? null,
    interval: c.interval ?? null,
    review_count: c.reviewCount ?? c.review_count ?? 0,
    due_date: c.dueDate ? new Date(c.dueDate) : null,
    last_reviewed: c.lastReviewed ? new Date(c.lastReviewed) : null,
    is_bookmarked: c.isBookmarked ?? false,
    bookmarked_at: c.bookmarkedAt ? new Date(c.bookmarkedAt) : null,
    meta: c.meta ?? {},
  })) as any[];

  const { data, error } = await supabaseAdmin
    .from("cards")
    .insert(rows as any)
    .select();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const payload: any = {};
  if (body.front !== undefined) payload.front = body.front;
  if (body.back !== undefined) payload.back = body.back;
  if (body.status !== undefined) payload.status = body.status;
  if (body.easeFactor !== undefined) payload.ease_factor = body.easeFactor;
  if (body.stability !== undefined) payload.stability = body.stability;
  if (body.difficulty !== undefined) payload.difficulty = body.difficulty;
  if (body.interval !== undefined) payload.interval = body.interval;
  if (body.reviewCount !== undefined) payload.review_count = body.reviewCount;
  if (body.lastReviewed !== undefined)
    payload.last_reviewed = body.lastReviewed
      ? new Date(body.lastReviewed)
      : null;
  if (body.dueDate !== undefined)
    payload.due_date = body.dueDate ? new Date(body.dueDate) : null;
  if (body.isBookmarked !== undefined) {
    payload.is_bookmarked = body.isBookmarked;
    payload.bookmarked_at = body.isBookmarked ? new Date() : null;
  }
  if (body.meta !== undefined) payload.meta = body.meta;

  const { data, error } = await supabaseAdmin
    .from("cards")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.[0] ?? null);
}

export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const qid = url.searchParams.get("id");
  const body = await req.json().catch(() => ({}));
  const id = qid || body.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
