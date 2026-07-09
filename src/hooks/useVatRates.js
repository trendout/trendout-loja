import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useVatRates() {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.from("vat_rates").select("*");
      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }
      const map = {};
      data.forEach((r) => { map[r.country_code] = Number(r.rate_percent); });
      setRates(map);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { rates, loading };
}
