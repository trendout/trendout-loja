import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useMyPoints(user) {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) { setBalance(0); setLedger([]); setLoading(false); return; }
      setLoading(true);

      const { data, error } = await supabase
        .from("points_ledger")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }

      const entries = data.map((p) => ({ points: p.points, reason: p.reason, createdAt: p.created_at }));
      setLedger(entries);
      setBalance(entries.reduce((s, p) => s + p.points, 0));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  return { balance, ledger, loading };
}
