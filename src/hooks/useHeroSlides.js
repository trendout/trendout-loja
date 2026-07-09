import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const FALLBACK_SLIDES = [
  { eyebrow: "Nova coleção", title: "TREINA MAIS FORTE", ctaLabel: "Ver coleção", href: "/categoria/Vestuário", imageUrl: null },
];

export function useHeroSlides() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("position");

      if (cancelled) return;
      if (error || !data || data.length === 0) { setLoading(false); return; }

      setSlides(
        data.map((s) => ({
          eyebrow: s.eyebrow,
          title: s.title,
          ctaLabel: s.cta_label,
          href: s.href,
          imageUrl: s.image_url,
        }))
      );
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { slides, loading };
}
