import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useFavoriteProducts(favoriteIds) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = [...favoriteIds];
      if (ids.length === 0) { setProducts([]); setLoading(false); return; }

      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .in("id", ids)
        .eq("is_active", true);

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
  }, [favoriteIds]);

  return { products, loading };
}
