import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useRelatedProducts(category, excludeId, limit = 4) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!category) { setLoading(false); return; }
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("is_active", true)
        .eq("category", category)
        .neq("id", excludeId || "")
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
  }, [category, excludeId, limit]);

  return { products, loading };
}
