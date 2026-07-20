// scripts/generate-sitemap.js
//
// Corre antes do `vite build` (ver .github/workflows/deploy.yml). Vai buscar
// produtos/categorias/coleções/páginas reais ao Supabase e escreve um
// sitemap.xml estático em public/, para acabar publicado em
// loja.trendout.pt/sitemap.xml — o Google só aceita sitemaps que vivam no
// mesmo domínio que verificaste, por isso não pode ser só a Edge Function.

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const STORE_URL = "https://loja.trendout.pt";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function escapeXml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc, lastmod, priority = "0.5") {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  const [{ data: products }, { data: categories }, { data: collections }, { data: pages }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("name"),
    supabase.from("collections").select("slug, updated_at").eq("is_active", true),
    supabase.from("pages").select("slug, updated_at").eq("status", "published"),
  ]);

  const entries = [urlEntry(STORE_URL, undefined, "1.0")];

  (categories || []).forEach((c) => entries.push(urlEntry(`${STORE_URL}/categoria/${encodeURIComponent(c.name)}`, undefined, "0.8")));
  (products || []).forEach((p) => entries.push(urlEntry(`${STORE_URL}/produto/${p.slug}`, p.updated_at, "0.7")));
  (collections || []).forEach((c) => entries.push(urlEntry(`${STORE_URL}/coleccao/${c.slug}`, c.updated_at, "0.6")));
  (pages || []).forEach((p) => entries.push(urlEntry(`${STORE_URL}/pagina/${p.slug}`, p.updated_at, "0.5")));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  writeFileSync("public/sitemap.xml", xml, "utf-8");
  console.log(`sitemap.xml gerado com ${entries.length} páginas.`);
}

main().catch((err) => {
  console.error("Erro ao gerar sitemap:", err);
  process.exit(1);
});
