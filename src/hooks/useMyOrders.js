import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useMyOrders(user) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) { setLoading(false); return; }
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }

      setOrders(
        data.map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          paymentMethod: o.payment_method,
          createdAt: o.created_at,
          total: Number(o.total),
          items: (o.order_items || []).map((it) => ({
            productName: it.product_name, size: it.size, color: it.color,
            quantity: it.quantity, lineTotal: Number(it.line_total),
          })),
        }))
      );
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  return { orders, loading };
}
