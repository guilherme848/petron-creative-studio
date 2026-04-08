#!/usr/bin/env node
/**
 * Roda migration SQL no Supabase automaticamente.
 * Uso: node scripts/migrate.mjs [arquivo.sql]
 *
 * Requer SUPABASE_DB_URL no .env.local
 * Pegue em: Supabase Dashboard > Settings > Database > Connection string (URI)
 */

import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("❌ SUPABASE_DB_URL não configurada no .env.local");
  console.error("   Pegue em: Supabase Dashboard > Settings > Database > Connection string (URI)");
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("❌ Informe o arquivo SQL: node scripts/migrate.mjs supabase-migration-products.sql");
  process.exit(1);
}

let sqlContent;
try {
  sqlContent = readFileSync(sqlFile, "utf-8");
} catch {
  console.error(`❌ Arquivo não encontrado: ${sqlFile}`);
  process.exit(1);
}

const statements = sqlContent
  .split("\n")
  .filter((line) => !line.trim().startsWith("--") && line.trim())
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`🔄 Rodando migration: ${sqlFile} (${statements.length} statements)`);

const { default: postgres } = await import("postgres");
const sql = postgres(dbUrl, { ssl: "require" });

try {
  for (const stmt of statements) {
    console.log(`   → ${stmt.substring(0, 80)}${stmt.length > 80 ? "..." : ""}`);
    await sql.unsafe(stmt);
  }
  console.log("✅ Migration aplicada com sucesso!");
} catch (err) {
  console.error(`❌ Erro: ${err.message}`);
  process.exit(1);
} finally {
  await sql.end();
}
