#!/usr/bin/env node
/**
 * Run SQL migration against the Creative Studio Supabase DB.
 *
 * Usage: node scripts/run-migration.mjs <path-to-sql-file>
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+)\s*$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("❌ SUPABASE_DB_URL not set in .env.local");
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("❌ Usage: node scripts/run-migration.mjs <path-to-sql-file>");
  process.exit(1);
}

const fullPath = path.resolve(sqlFile);
if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(fullPath, "utf8");
console.log(`→ Running migration: ${path.basename(fullPath)}`);
console.log(`→ Target DB: ${connectionString.replace(/:[^:@]+@/, ":***@")}`);

const sql = postgres(connectionString, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
  prepare: false,
});

try {
  await sql.unsafe(sqlContent);
  console.log("✅ Migration applied successfully");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
