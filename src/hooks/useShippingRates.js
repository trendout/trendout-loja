import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useShippingRates() {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.from("shipping_rates").select("*");
      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }
      const map = {};
      data.forEach((r) => {
        map[r.country_code] = {
          label: r.label,
          standard: Number(r.standard_price),
          express: Number(r.express_price),
          standardEta: r.standard_eta,
          expressEta: r.express_eta,
          freeEligible: r.free_eligible,
        };
      });
      setRates(map);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { rates, loading };
}
