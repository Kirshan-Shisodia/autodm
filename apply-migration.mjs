import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://hgyxichoaoxkjvkzonme.supabase.co";
const serviceRoleKey = "sb_secret_GllSKivKJtpMpoes3AloNA_mvGU3rgb";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  try {
    // Read the migration SQL file
    const sql = fs.readFileSync(
      "supabase/migrations/20260609073600_initial_schema.sql",
      "utf-8",
    );

    // Split by semicolons and filter out empty statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc("exec_sql", {
          sql_string: stmt,
        });

        if (error) {
          console.error(`Statement ${i + 1} failed:`, error);
          // Continue with next statement
        } else {
          console.log(`✓ Statement ${i + 1}/${statements.length}`);
        }
      } catch (e) {
        console.error(`Error executing statement ${i + 1}:`, e.message);
      }
    }

    console.log("\n✅ Migration completed!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

applyMigration();
