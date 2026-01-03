import { supabaseAdmin } from "../lib/supabase.server";

async function run() {
  const email = "demo@local";
  const name = "Demo User";
  const password = "password123";

  // Check if user exists
  const { data: listData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  const exists = listData.users?.find((u: any) => u.email === email);
  if (exists) {
    console.log("Demo user already exists in Supabase");
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  } as any);

  if (error) throw error;
  console.log("Created demo user:", data.user?.id);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
