// Apply one migration file to the linked Supabase project.
//
//   node apply-migration.mjs supabase/migrations/20260802130000_leads_crm.sql
//
// Prefer the Supabase CLI (`supabase db push`) when you have a real access
// token. This script exists for the case where you don't — it needs only the
// service-role key, which .env.local already has.
//
// Credentials come from the environment. They used to be hardcoded in this
// file, which put a service-role key — the one that bypasses RLS entirely —
// into git history. If you are reading this soon after that change, rotate the
// key in the Supabase dashboard: removing it from the working tree does not
// remove it from the history.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const url =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !serviceRoleKey) {
  console.error(
    "Missing credentials.\n" +
      "  NEXT_PUBLIC_SUPABASE_URL   " +
      (url ? "ok" : "MISSING") +
      "\n" +
      "  SUPABASE_SERVICE_ROLE_KEY  " +
      (serviceRoleKey ? "ok" : "MISSING") +
      "\n\n" +
      "Both live in .env.local. Load them first, e.g.\n" +
      "  set -a && . ./.env.local && set +a && node apply-migration.mjs <file>",
  );
  process.exit(1);
}

const file = process.argv[2];

if (!file) {
  console.error(
    "Usage: node apply-migration.mjs <path-to-migration.sql>\n\n" +
      "Available:\n" +
      fs
        .readdirSync("supabase/migrations")
        .map((f) => `  supabase/migrations/${f}`)
        .join("\n"),
  );
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error(`No such file: ${file}`);
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf-8");

// The whole file goes over as ONE statement, deliberately.
//
// The previous version split on ";" and sent the pieces one at a time. That
// silently corrupts any migration containing a function body: everything
// between `$$ ... $$` is full of semicolons, and splitting on them cuts the
// body into fragments that are not valid SQL. It also meant a failure halfway
// through left the schema half-migrated, because each fragment was its own
// transaction. Postgres is perfectly happy to execute a multi-statement string
// in a single call, atomically.
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

console.log(`Applying ${path.basename(file)} …`);

const { error } = await supabase.rpc("exec_sql", { sql_string: sql });

if (error) {
  console.error(`\n✗ Migration failed:\n${error.message}`);

  if (/function .*exec_sql.* does not exist|schema cache/i.test(error.message)) {
    console.error(
      "\nThis project has no exec_sql helper. Either paste the migration into\n" +
        "the Supabase SQL editor, or create the helper once:\n\n" +
        "  create or replace function public.exec_sql(sql_string text)\n" +
        "  returns void language plpgsql security definer as $$\n" +
        "  begin execute sql_string; end $$;\n" +
        "  revoke all on function public.exec_sql(text) from public, anon, authenticated;\n\n" +
        "Note that exec_sql is arbitrary SQL execution. Granting it to anything\n" +
        "other than service_role hands that role the whole database.",
    );
  }

  process.exit(1);
}

console.log(`✓ Applied ${path.basename(file)}`);
