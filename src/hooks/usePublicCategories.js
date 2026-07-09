import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function usePublicCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.from("categories").select("*").order("position");
      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }
      setCategories(
        data.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parent_id }))
      );
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const subcategoriesOf = (topCategoryName) => {
    const top = categories.find((c) => c.name === topCategoryName && !c.parentId);
    if (!top) return [];
    return categories.filter((c) => c.parentId === top.id);
  };

  return { categories, subcategoriesOf, loading };
}
