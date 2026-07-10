import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function usePageBySlug(slug) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (cancelled) return;

      if (err || !data) {
        setError(err?.message || "Página não encontrada.");
        setLoading(false);
        return;
      }

      setPage({
        title: data.title,
        content: data.content,
        featuredImage: data.featured_image,
        metaDescription: data.meta_description,
      });
      setLoading(false);
    }

    if (slug) load();
    return () => { cancelled = true; };
  }, [slug]);

  return { page, loading, error };
}
