import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Vai buscar uma coleção pelo slug (ex: "mais-vendidos") com os produtos
 * ativos que lhe foram associados no backoffice, pela ordem definida lá.
 */
export function useCollectionBySlug(slug) {
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("collections")
        .select("*, collection_products(position, products(*, product_variants(*)))")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (cancelled) return;

      if (err || !data) {
        setError(err?.message || "Coleção não encontrada.");
        setLoading(false);
        return;
      }

      setCollection({ id: data.id, name: data.name, slug: data.slug, description: data.description });

      const items = (data.collection_products || [])
        .sort((a, b) => a.position - b.position)
        .map((cp) => cp.products)
        .filter((p) => p && p.is_active)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          category: p.category,
          basePrice: Number(p.base_price),
          compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
          availability: p.availability,
          images: p.images || [],
          variants: (p.product_variants || []).map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })),
        }));

      setProducts(items);
      setLoading(false);
    }

    if (slug) load();
    return () => { cancelled = true; };
  }, [slug]);

  return { collection, products, loading, error };
}
