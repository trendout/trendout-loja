import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useProduct(slug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setProduct({
        id: data.id,
        name: data.name,
        slug: data.slug,
        reference: data.reference,
        brand: data.brand,
        ean: data.ean,
        weightGrams: data.weight_grams,
        description: data.description,
        features: data.features || [],
        topCategory: data.top_category,
        category: data.category,
        basePrice: Number(data.base_price),
        compareAtPrice: data.compare_at_price ? Number(data.compare_at_price) : null,
        couponCode: data.coupon_code,
        availability: data.availability,
        images: data.images || [],
        variants: (data.product_variants || []).map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: v.stock,
        })),
      });
      setLoading(false);
    }

    if (slug) load();
    return () => { cancelled = true; };
  }, [slug]);

  return { product, loading, error };
}
