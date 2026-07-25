import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useMyAffiliateCoupons(user) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) { setCoupons([]); setLoading(false); return; }
      setLoading(true);

      const { data: myCoupons, error } = await supabase
        .from("coupons")
        .select("code, commission_rate")
        .eq("owner_customer_id", user.id);

      if (cancelled) return;
      if (error || !myCoupons || myCoupons.length === 0) { setCoupons([]); setLoading(false); return; }

      const { data: commissions } = await supabase
        .from("influencer_commissions")
        .select("coupon_code, commission_amount, status, created_at")
        .eq("customer_id", user.id);

      const result = myCoupons.map((c) => {
        const mine = (commissions || []).filter((x) => x.coupon_code === c.code);
        return {
          code: c.code,
          rate: Number(c.commission_rate),
          usageCount: mine.length,
          pendingTotal: mine.filter((x) => x.status === "pending").reduce((s, x) => s + Number(x.commission_amount), 0),
          paidTotal: mine.filter((x) => x.status === "paid").reduce((s, x) => s + Number(x.commission_amount), 0),
        };
      });

      setCoupons(result);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  return { coupons, loading };
}
