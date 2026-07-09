import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Vai buscar produtos ativos e disponíveis de uma categoria (ou subcategoria),
 * já com as variantes incluídas — para a página de coleção poder filtrar
 * por tamanho, cor, marca e preço no browser.
 *
 * @param {string} categoryName - nome exato da categoria/subcategoria (ex: "T-shirts técnicas")
 */
export function useCollectionProducts(categoryName) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("is_active", true);

      if (categoryName) {
        // aceita corresponder tanto à subcategoria como à categoria principal
        query = query.or(`category.eq.${categoryName},top_category.eq.${categoryName}`);
      }

      const { data, error: err } = await query.order("created_at", { ascending: false });

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          category: p.category,
          topCategory: p.top_category,
          basePrice: Number(p.base_price),
          compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
          availability: p.availability,
          images: p.images || [],
          variants: (p.product_variants || []).map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            stock: v.stock,
          })),
        }))
      );
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [categoryName]);

  return { products, loading, error };
}
