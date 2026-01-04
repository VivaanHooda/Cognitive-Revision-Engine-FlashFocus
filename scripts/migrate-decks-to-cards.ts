import { supabaseAdmin } from "../lib/supabase.server";

async function run() {
  console.log("Fetching decks to migrate...");
  const { data: decks, error } = await supabaseAdmin.from("decks").select("*");
  if (error) throw error;
  if (!decks || decks.length === 0) {
    console.log("No decks to migrate.");
    return;
  }

  const rows: any[] = [];
  for (const deck of decks as any[]) {
    const cards = deck.cards || [];
    for (const c of cards) {
      rows.push({
        id: c.id,
        deck_id: deck.id,
        user_id: deck.user_id,
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

  if (rows.length === 0) {
    console.log("No cards found in decks to migrate.");
    return;
  }

  console.log(`Inserting ${rows.length} cards...`);
  const { error: insertErr } = await supabaseAdmin.from("cards").insert(rows);
  if (insertErr) throw insertErr;
  console.log("Migration completed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
