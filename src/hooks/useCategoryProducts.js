import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Vai buscar até `limit` produtos ativos de uma categoria principal (ex: "Vestuário"),
 * para preencher a secção/carrossel dessa categoria na homepage.
 */
export function useCategoryProducts(topCategoryName, limit = 6) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("is_active", true)
        .eq("top_category", topCategoryName)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }

      setProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          basePrice: Number(p.base_price),
          compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
          availability: p.availability,
          images: p.images || [],
          variants: (p.product_variants || []).map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
        }))
      );
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [topCategoryName, limit]);

  return { products, loading };
}
