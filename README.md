<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1hvnYohCcWsAE6FV4n2EWM57Neoey_xrG

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. (Optional) To persist users/decks using Supabase Auth + DB, add these env vars to `.env.local`:

   - `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL` (same as SUPABASE_URL)
   - `SUPABASE_SERVICE_KEY` (service role key, server-only)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client anon key)

   Create the `decks` table in your Supabase database (use the SQL editor or psql). You can use the provided SQL file `scripts/create_supabase_schema.sql`:

   ```sql
   -- Run the contents of scripts/create_supabase_schema.sql in Supabase SQL editor
   ```

   The SQL enables Row Level Security (RLS) and creates a policy so authenticated users can only access their own decks — confirm these policies in the Supabase SQL editor or Dashboard.

   Then install the client packages and run the demo migration:

   ```bash
   npm install @supabase/supabase-js ts-node
   npm run migrate:demo
   ```

   This will create the demo user in your Supabase project and you can seed decks by visiting the app or running the demo migrations.

4. Run the app:
   `npm run dev`
