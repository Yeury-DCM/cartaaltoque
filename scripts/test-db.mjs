// Corre las migraciones y las pruebas de aislamiento multi-tenant en un Postgres
// en memoria (PGlite). Uso: npm run test:db
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = join(import.meta.dirname, "..", "supabase");
const read = (...p) => readFileSync(join(root, ...p), "utf8");

const db = new PGlite();
try {
  await db.exec(read("tests", "supabase_stubs.sql"));
  for (const file of readdirSync(join(root, "migrations")).sort()) {
    await db.exec(read("migrations", file));
    console.log(`✓ migración ${file}`);
  }
  // La migración tiene que poder correrse dos veces sin romperse.
  for (const file of readdirSync(join(root, "migrations")).sort()) {
    await db.exec(read("migrations", file));
  }
  console.log("✓ migraciones idempotentes");

  const results = await db.exec(read("tests", "rls_test.sql"));
  const passed = results.some((r) => r.rows?.[0]?.result === "ALL TESTS PASSED");
  if (!passed) throw new Error("Las pruebas no llegaron al final");
  console.log("✓ pruebas de aislamiento: ALL TESTS PASSED");
} catch (e) {
  console.error("✗", e.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
