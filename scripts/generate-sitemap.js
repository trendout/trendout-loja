// scripts/generate-sitemap.js
//
// Corre antes do `vite build` (ver .github/workflows/deploy.yml). Vai buscar
// produtos/categorias/coleções/páginas reais ao Supabase (via pedidos REST
// diretos — evita o cliente completo do supabase-js, que exige WebSocket
// nativo e falha no Node 20 do GitHub Actions) e escreve um sitemap.xml
// estático em public/, para acabar publicado em loja.trendout.pt/sitemap.xml.

import { writeFileSync } from "fs";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const STORE_URL = "https://loja.trendout.pt";

async function fetchTable(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Falha ao ir buscar ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

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
  const [products, categories, collections, pages] = await Promise.all([
    fetchTable("products", "select=slug,updated_at&is_active=eq.true"),
    fetchTable("categories", "select=name"),
    fetchTable("collections", "select=slug,updated_at&is_active=eq.true"),
    fetchTable("pages", "select=slug,updated_at&status=eq.published"),
  ]);

  const entries = [urlEntry(STORE_URL, undefined, "1.0")];

  categories.forEach((c) => entries.push(urlEntry(`${STORE_URL}/categoria/${encodeURIComponent(c.name)}`, undefined, "0.8")));
  products.forEach((p) => entries.push(urlEntry(`${STORE_URL}/produto/${p.slug}`, p.updated_at, "0.7")));
  collections.forEach((c) => entries.push(urlEntry(`${STORE_URL}/coleccao/${c.slug}`, c.updated_at, "0.6")));
  pages.forEach((p) => entries.push(urlEntry(`${STORE_URL}/pagina/${p.slug}`, p.updated_at, "0.5")));

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
