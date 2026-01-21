import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";
import { getUserFromRequest } from "@/lib/auth.server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  console.log('[api/decks] GET request received');
  console.log('[api/decks] Authorization header:', req.headers.get('Authorization')?.substring(0, 20) + '...');
  
  const user = await getUserFromRequest(req);
  // Allow unauthenticated GET requests and return an empty list rather than 401 so
  // client-side code (e.g., init) can proceed without throwing.
  if (!user) {
    console.log('[api/decks] No authenticated user found, returning empty array');
    return NextResponse.json([]);
  }
  
  console.log('[api/decks] Fetching decks for user:', user.id);

  const { data, error } = await supabaseAdmin
    .from("decks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Transform snake_case to camelCase for frontend
  const transformedData = (data ?? []).map((deck: any) => ({
    ...deck,
    parentTopic: deck.parent_topic,
    lastStudied: deck.last_studied,
    isStarred: deck.is_starred,
    categoryOrder: deck.category_order,
  }));
  
  // Return with no-cache headers
  return NextResponse.json(transformedData, {
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
  if (!body)
    return NextResponse.json({ error: "Missing body" }, { status: 400 });

  // Accept either a single deck or array of decks
  const decks = Array.isArray(body) ? body : [body];

  const rows = decks.map((deck: any) => ({
    id: deck.id,
    user_id: user.id,
    title: deck.title,
    description: deck.description || "",
    parent_topic: deck.parentTopic || null,
    is_starred: deck.isStarred || false,
    category_order: deck.categoryOrder || 0,
    // Keep deck.cards for backwards-compat but we'll also insert them into cards table
    cards: deck.cards || [],
    last_studied: deck.lastStudied ? new Date(deck.lastStudied) : null,
  }));

  const { data, error } = await supabaseAdmin
    .from("decks")
    .insert(rows)
    .select();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // If cards were provided, insert them into the normalized cards table
  try {
    const insertRows: any[] = [];
    for (const deck of data as any[]) {
      const incoming = decks.find((d: any) => d.id === deck.id) || {};
      const cards = incoming.cards || [];
      for (const c of cards) {
        insertRows.push({
          id: c.id,
          deck_id: deck.id,
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
          meta: c.meta ?? {},
        });
      }
    }

    if (insertRows.length > 0) {
      const { data: cardsData, error: cardsErr } = await supabaseAdmin
        .from("cards")
        .insert(insertRows)
        .select();
      if (cardsErr) {
        // Log but do not fail the whole request
        console.error("Failed to insert cards for new decks:", cardsErr);
      } else {
        // Attach inserted cards back to decks in the response
        const cardsByDeck: Record<string, any[]> = {};
        for (const c of cardsData || []) {
          cardsByDeck[c.deck_id] = cardsByDeck[c.deck_id] || [];
          cardsByDeck[c.deck_id].push(c);
        }
        const enriched = (data as any[]).map((deck) => ({
          ...deck,
          cards: cardsByDeck[deck.id] || deck.cards || [],
        }));
        return NextResponse.json(enriched);
      }
    }
  } catch (e) {
    console.error("Error inserting cards:", e);
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updated } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const payload: any = {};
  if (updated.title !== undefined) payload.title = updated.title;
  if (updated.description !== undefined)
    payload.description = updated.description;
  if (updated.parentTopic !== undefined)
    payload.parent_topic = updated.parentTopic;
  if (updated.lastStudied !== undefined)
    payload.last_studied = updated.lastStudied
      ? new Date(updated.lastStudied)
      : null;
  if (updated.isStarred !== undefined)
    payload.is_starred = updated.isStarred;
  if (updated.categoryOrder !== undefined)
    payload.category_order = updated.categoryOrder;

  // Update deck metadata
  const { data: deckData, error: deckErr } = await supabaseAdmin
    .from("decks")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (deckErr)
    return NextResponse.json({ error: deckErr.message }, { status: 500 });

  // If cards are provided in the update, sync them into the cards table
  if (updated.cards !== undefined) {
    const cards = updated.cards as any[];
    try {
      const toInsert: any[] = [];
      for (const c of cards) {
        if (!c.id) {
          // new card -> insert
          toInsert.push({
            deck_id: id,
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
            meta: c.meta ?? {},
          });
        } else {
          // existing card -> update
          const payloadCard: any = {};
          if (c.front !== undefined) payloadCard.front = c.front;
          if (c.back !== undefined) payloadCard.back = c.back;
          if (c.status !== undefined) payloadCard.status = c.status;
          if (c.easeFactor !== undefined)
            payloadCard.ease_factor = c.easeFactor;
          if (c.stability !== undefined) payloadCard.stability = c.stability;
          if (c.difficulty !== undefined) payloadCard.difficulty = c.difficulty;
          if (c.interval !== undefined) payloadCard.interval = c.interval;
          if (c.reviewCount !== undefined)
            payloadCard.review_count = c.reviewCount;
          if (c.lastReviewed !== undefined)
            payloadCard.last_reviewed = c.lastReviewed
              ? new Date(c.lastReviewed)
              : null;
          if (c.dueDate !== undefined)
            payloadCard.due_date = c.dueDate ? new Date(c.dueDate) : null;
          if (c.meta !== undefined) payloadCard.meta = c.meta;

          await supabaseAdmin
            .from("cards")
            .update(payloadCard)
            .eq("id", c.id)
            .eq("user_id", user.id);
        }
      }

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabaseAdmin
          .from("cards")
          .insert(toInsert);
        if (insertErr)
          console.error("Failed to insert cards on deck update:", insertErr);
      }
    } catch (e) {
      console.error("Error syncing cards on deck update:", e);
    }
  }

  // Return the updated deck (cards should be fetched via /api/cards on the client)
  return NextResponse.json(deckData?.[0] ?? null);
}

export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // support both query ?id= and body { id }
  const url = new URL(req.url);
  const qid = url.searchParams.get("id");
  const body = await req.json().catch(() => ({}));
  const id = qid || body.id;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("decks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
