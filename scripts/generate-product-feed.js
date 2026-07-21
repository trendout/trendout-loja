// scripts/generate-product-feed.js
//
// Corre antes do `vite build` (ver .github/workflows/deploy.yml), tal como
// o generate-sitemap.js. Gera um feed de produtos no formato que o Google
// Merchant Center espera (RSS 2.0 com namespace "g"), e escreve-o em
// public/product-feed.xml — para acabar publicado em
// loja.trendout.pt/product-feed.xml (tem de viver no domínio da loja,
// já verificado no Search Console/Merchant Center).

import { writeFileSync } from "fs";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const STORE_URL = "https://loja.trendout.pt";
const STORE_NAME = "Trendout";

async function fetchTable(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Falha ao ir buscar ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

function escapeXml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stripHtml(str) {
  return String(str || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const products = await fetchTable(
    "products",
    "select=id,name,slug,brand,ean,description,base_price,compare_at_price,availability,images,is_active,product_variants(stock)&is_active=eq.true"
  );

  const items = products.map((p) => {
    const totalStock = (p.product_variants || []).reduce((s, v) => s + (v.stock || 0), 0);
    const inStock = p.availability !== "unavailable" && p.availability !== "out_of_stock" && totalStock > 0;
    const image = (p.images || [])[0] || "";
    const link = `${STORE_URL}/produto/${p.slug}`;
    const description = stripHtml(p.description) || p.name;

    return `  <item>
    <g:id>${escapeXml(p.id)}</g:id>
    <title>${escapeXml(p.name)}</title>
    <description>${escapeXml(description)}</description>
    <link>${escapeXml(link)}</link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>${inStock ? "in stock" : "out of stock"}</g:availability>
    <g:price>${Number(p.base_price).toFixed(2)} EUR</g:price>
    <g:condition>new</g:condition>
    <g:brand>${escapeXml(p.brand || STORE_NAME)}</g:brand>
    ${p.ean ? `<g:gtin>${escapeXml(p.ean)}</g:gtin>` : ""}
  </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${STORE_NAME}</title>
  <link>${STORE_URL}</link>
  <description>Feed de produtos ${STORE_NAME} para o Google Merchant Center</description>
${items}
</channel>
</rss>
`;

  writeFileSync("public/product-feed.xml", xml, "utf-8");
  console.log(`product-feed.xml gerado com ${products.length} produtos.`);
}

main().catch((err) => {
  console.error("Erro ao gerar feed de produtos:", err);
  process.exit(1);
});
