const { supabaseAdmin } = require("../lib/supabase.server");

async function run() {
  const email = "demo@local";
  const name = "Demo User";
  const password = "password123";

  const { data: listData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  const exists =
    listData.users && listData.users.find((u) => u.email === email);
  if (exists) {
    console.log("Demo user already exists in Supabase");
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) throw error;
  const uid = data.user && data.user.id;
  console.log("Created demo user:", uid);

  if (uid) {
    const { data: decksData, error: decksErr } = await supabaseAdmin
      .from("decks")
      .select("id")
      .eq("user_id", uid)
      .limit(1);

    if (decksErr) throw decksErr;

    if (!decksData || decksData.length === 0) {
      const { INITIAL_DECKS } = require("../lib/mockData");
      const rows = INITIAL_DECKS.map(function (d) {
        return {
          id: d.id,
          user_id: uid,
          title: d.title,
          description: d.description || "",
          parent_topic: d.parentTopic || null,
          cards: d.cards || [],
        };
      });
      const { error: insertErr } = await supabaseAdmin
        .from("decks")
        .insert(rows);
      if (insertErr) throw insertErr;
      console.log("Inserted initial demo decks");

      // Insert demo cards into normalized cards table as well
      const cardRows = INITIAL_DECKS.flatMap(function (d) {
        return d.cards.map(function (c) {
          return {
            id: c.id,
            deck_id: d.id,
            user_id: uid,
            front: c.front,
            back: c.back,
            status: c.status || "new",
            ease_factor: c.easeFactor || null,
            stability: c.stability || null,
            difficulty: c.difficulty || null,
            interval: c.interval || null,
            review_count: c.reviewCount || 0,
            due_date: c.dueDate ? new Date(c.dueDate) : null,
            last_reviewed: c.lastReviewed ? new Date(c.lastReviewed) : null,
            meta: c.meta || {},
          };
        });
      });

      if (cardRows.length > 0) {
        const { error: insertCardsErr } = await supabaseAdmin
          .from("cards")
          .insert(cardRows);
        if (insertCardsErr) throw insertCardsErr;
        console.log("Inserted demo cards into cards table");
      }
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
