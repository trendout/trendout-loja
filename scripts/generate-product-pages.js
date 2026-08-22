// scripts/generate-product-pages.js
//
// Corre DEPOIS do `vite build` (precisa do dist/index.html já pronto, com os
// nomes reais dos ficheiros JS/CSS). Para cada produto ativo, cria um
// ficheiro HTML próprio em dist/produto/<slug>/index.html — assim o GitHub
// Pages devolve um 200 a sério para essa página (resolve o "página de
// produto indisponível" do Merchant Center), e o Facebook/WhatsApp já veem
// a foto/título/preço corretos ao partilhar um produto específico.
//
// A app React continua a assumir o controlo assim que carrega — isto não
// substitui a SPA, só garante que a primeira resposta do servidor já é 200
// com a informação certa, antes do JavaScript sequer correr.

import { readFileSync, writeFileSync, mkdirSync } from "fs";

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

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stripHtml(str) {
  return String(str || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildProductHtml(template, product, reviewStats) {
  const title = `${product.name} — Trendout`;
  const description = stripHtml(product.description) || `Compra ${product.name} na Trendout.`;
  const image = product.images?.[0] || `${STORE_URL}/og-image.png`;
  const url = `${STORE_URL}/produto/${product.slug}`;
  const price = Number(product.base_price).toFixed(2);

  let html = template;

  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);

  // substitui a meta descrição e as etiquetas Open Graph/Twitter já existentes no template
  html = html.replace(/<meta name="description" content=".*?"\s*\/?>/s, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/?>/s, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/?>/s, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:image" content=".*?"\s*\/?>/s, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/?>/s, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = html.replace(/<meta property="og:type" content=".*?"\s*\/?>/s, `<meta property="og:type" content="product" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/?>/s, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/?>/s, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/?>/s, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);

  // etiquetas de preço, específicas de Open Graph tipo "product"
  const productMeta = `    <meta property="product:price:amount" content="${price}" />\n    <meta property="product:price:currency" content="EUR" />\n  `;
  html = html.replace("</head>", `${productMeta}</head>`);

  // dados estruturados (schema.org Product) — é isto que o Google, o Merchant
  // Center, e agora também os robôs de motores de IA (GPTBot, PerplexityBot,
  // ClaudeBot) leem para saberem preço, disponibilidade, e avaliações, sem
  // precisarem de correr JavaScript nenhum.
  const totalStock = (product.product_variants || []).reduce((s, v) => s + (v.stock || 0), 0);
  const availability = product.availability === "unavailable" || totalStock === 0
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: description || undefined,
    image: product.images && product.images.length ? product.images : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price,
      availability,
    },
    aggregateRating: reviewStats ? {
      "@type": "AggregateRating",
      ratingValue: reviewStats.average,
      reviewCount: reviewStats.count,
    } : undefined,
  };
  const jsonLdScript = `<script type="application/ld+json" id="product-jsonld">${JSON.stringify(jsonLd)}</script>`;
  html = html.replace("</head>", `${jsonLdScript}</head>`);

  return html;
}

async function main() {
  const template = readFileSync("dist/index.html", "utf-8");

  const products = await fetchTable(
    "products",
    "select=id,name,slug,description,images,base_price,brand,availability,product_variants(stock)&is_active=eq.true"
  );

  const reviews = await fetchTable("product_reviews", "select=product_id,rating&status=eq.approved");
  const reviewsByProduct = {};
  reviews.forEach((r) => {
    if (!reviewsByProduct[r.product_id]) reviewsByProduct[r.product_id] = [];
    reviewsByProduct[r.product_id].push(r.rating);
  });

  products.forEach((p) => {
    const ratings = reviewsByProduct[p.id] || [];
    const reviewStats = ratings.length > 0
      ? { average: ratings.reduce((s, r) => s + r, 0) / ratings.length, count: ratings.length }
      : null;

    const dir = `dist/produto/${p.slug}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/index.html`, buildProductHtml(template, p, reviewStats), "utf-8");
  });

  console.log(`Geradas ${products.length} páginas de produto estáticas.`);
}

main().catch((err) => {
  console.error("Erro ao gerar páginas de produto:", err);
  process.exit(1);
});
