// Upload a FSRS params JSON file to Supabase srs_params table for a user
// Usage: node ./scripts/upload-fsrs-params.js <path-to-json> [user_id]

const fs = require("fs");
const { supabaseAdmin } = require("../../lib/supabase.server");

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      "Usage: node ./scripts/upload-fsrs-params.js <path-to-json> [user_id]"
    );
    process.exit(1);
  }

  const filePath = args[0];
  const userId = args[1] || process.env.UPLOAD_USER_ID;
  if (!userId) {
    console.error(
      "Missing user_id: pass as 2nd arg or set UPLOAD_USER_ID env var"
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  let params;
  try {
    params = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    process.exit(1);
  }

  const { data, error } = await supabaseAdmin
    .from("srs_params")
    .upsert({ user_id: userId, params }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("Failed to upsert params:", error);
    process.exit(1);
  }

  console.log("Uploaded params for user", userId);
  console.log(data);
  process.exit(0);
}

main();
