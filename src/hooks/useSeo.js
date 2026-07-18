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
 * Corta um texto num limite de caracteres sem cortar a meio de uma palavra —
 * útil para gerar uma meta descrição a partir de uma descrição mais longa.
 */
export function truncateForMeta(text, maxLength = 155) {
  if (!text) return "";
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
