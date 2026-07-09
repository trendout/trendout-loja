import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useFeaturedCollections(limitPerCollection = 4) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("collections")
        .select("*, collection_products(position, products(*, product_variants(*)))")
        .eq("is_active", true)
        .order("position");

      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }

      setCollections(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          products: (c.collection_products || [])
            .sort((a, b) => a.position - b.position)
            .slice(0, limitPerCollection)
            .map((cp) => cp.products)
            .filter(Boolean)
            .filter((p) => p.is_active)
            .map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              brand: p.brand,
              basePrice: Number(p.base_price),
              compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
              availability: p.availability,
              images: p.images || [],
              variants: (p.product_variants || []).map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
            })),
        })).filter((c) => c.products.length > 0)
      );
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [limitPerCollection]);

  return { collections, loading };
}
