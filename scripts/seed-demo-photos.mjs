// Siembra las fotos del restaurante demo (/r/demo). Correr DESPUÉS de supabase/seed_demo.sql:
//   node scripts/seed-demo-photos.mjs
// Usa SUPABASE_ACCESS_TOKEN de .env.deploy.local para pedir la llave de servicio (no se imprime).
// Fotos: Pexels (licencia de uso comercial): tostones 39143744, yuquitas 14883833,
// costillas 38545816, pollo 34463128, hamburguesa 28828555, limonada 4134388.
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");
const env = Object.fromEntries(readFileSync(join(root, ".env.deploy.local"), "utf8").split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#")).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const REF = "ghptqhnhhazaufcchzsw";
const mgmt = { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" };
const sql = async (query) => { const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, { method: "POST", headers: mgmt, body: JSON.stringify({ query }) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const keys = await (await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: mgmt })).json();
const svc = keys.find(k => k.name === "service_role")?.api_key;
if (!svc) throw new Error("sin service_role");
const items = await sql(`select i.id as item_id, i.name, r.id as rid from public.items i join public.restaurants r on r.id=i.restaurant_id where r.slug='demo'`);
const MAP = { "Tostones": "tostones", "Yuquitas de queso": "yuquitas", "Costillas BBQ": "costillas", "Pollo a la parrilla": "pollo", "Hamburguesa de la casa": "hamburguesa", "Limonada frozen": "limonada" };
const dir = join(root, "supabase", "demo-photos") + "/";
for (const it of items) {
  const f = MAP[it.name]; if (!f) { console.log("sin foto:", it.name); continue; }
  const uuid = crypto.randomUUID();
  const path = `${it.rid}/items/${it.item_id}/${uuid}.webp`;
  for (const [p, file] of [[path, f + ".webp"], [path.replace(/\.webp$/, "-sm.webp"), f + "-sm.webp"]]) {
    const r = await fetch(`https://${REF}.supabase.co/storage/v1/object/media/${p}`, { method: "POST", headers: { Authorization: `Bearer ${svc}`, apikey: svc, "Content-Type": "image/webp", "cache-control": "max-age=31536000" }, body: readFileSync(dir + file) });
    if (!r.ok) throw new Error(`${p}: ${r.status} ${await r.text()}`);
  }
  await sql(`delete from public.item_photos where item_id='${it.item_id}'; insert into public.item_photos (restaurant_id,item_id,path,is_primary,sort_order) values ('${it.rid}','${it.item_id}','${path}',true,0)`);
  console.log("ok", it.name);
}
