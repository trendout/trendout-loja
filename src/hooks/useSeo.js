import { useEffect } from "react";

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Define o título da aba do browser e a meta descrição (o texto que aparece
 * nos resultados do Google) para a página atual. Chamar em cada página com
 * o título/descrição específicos dela.
 *
 * @param {string} title - título completo (ex: "Camisola X — Trendout")
 * @param {string} description - até ~155 caracteres, sem ser genérico
 * @param {boolean} noindex - true para páginas que não devem aparecer no Google
 *   (conta, checkout, confirmação de encomenda — informação privada/transitória)
 */
export function useSeo({ title, description, noindex = false } = {}) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta("description", description);
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
  }, [title, description, noindex]);
}

/**
 * Insere os dados estruturados (JSON-LD) de um produto — etiquetas invisíveis
 * que ajudam o Google a mostrar preço/disponibilidade diretamente nos
 * resultados de pesquisa. Remove-se sozinho quando a página muda.
 */
export function useProductJsonLd(product, productUrl) {
  useEffect(() => {
    if (!product) return;

    const totalStock = (product.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
    const availability = product.availability === "unavailable" || totalStock === 0
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

    const data = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      description: product.description || undefined,
      image: product.images && product.images.length ? product.images : undefined,
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "EUR",
        price: product.basePrice,
        availability,
      },
    };

    let script = document.getElementById("product-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "product-jsonld";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);

    return () => { script?.remove(); };
  }, [product, productUrl]);
}

/**
 * Corta um texto num limite de caracteres sem cortar a meio de uma palavra —
 * útil para gerar uma meta descrição a partir de uma descrição mais longa.
 */
export function truncateForMeta(text, maxLength = 155) {
  if (!text) return "";
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
