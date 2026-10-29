// Activa el inicio de sesión con Google en Supabase Auth.
// Lee GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET de .env.deploy.local (no se sube a git).
// Uso: node scripts/enable-google.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_REF = "ghptqhnhhazaufcchzsw";
const root = join(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.deploy.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const { SUPABASE_ACCESS_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env;
if (!SUPABASE_ACCESS_TOKEN || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error(
    "Faltan SUPABASE_ACCESS_TOKEN, GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env.deploy.local",
  );
  process.exit(1);
}
if (!GOOGLE_CLIENT_SECRET.startsWith("GOCSPX-")) {
  console.error("GOOGLE_CLIENT_SECRET no parece un secreto de Google (debe empezar con GOCSPX-).");
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    external_google_enabled: true,
    external_google_client_id: GOOGLE_CLIENT_ID,
    external_google_secret: GOOGLE_CLIENT_SECRET,
  }),
});
const j = await res.json();
if (!res.ok) {
  console.error("✗", res.status, JSON.stringify(j).slice(0, 300));
  process.exit(1);
}
console.log(
  "✓ Google activado en Supabase:",
  j.external_google_enabled,
  "| client id:",
  j.external_google_client_id,
);
