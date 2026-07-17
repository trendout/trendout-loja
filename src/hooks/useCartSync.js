import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useCart } from "./useCart";
import { useCustomerAuth } from "./useCustomerAuth";

/**
 * Guarda o carrinho na base de dados sempre que muda — só para clientes
 * com sessão iniciada. Serve para conseguirmos avisar por email se o
 * carrinho ficar abandonado (ver Edge Function send-abandoned-cart-emails).
 */
export function useCartSync() {
  const { user } = useCustomerAuth();
  const { items, subtotal } = useCart();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (items.length === 0) {
        // carrinho vazio (esvaziado ou já comprou) — deixa de contar como abandonado
        await supabase.from("cart_snapshots").delete().eq("customer_id", user.id);
        return;
      }

      await supabase.from("cart_snapshots").upsert({
        customer_id: user.id,
        customer_email: user.email,
        items: items.map((i) => ({
          name: i.name, size: i.size, color: i.color, price: i.price, qty: i.qty, image: i.image, productId: i.productId,
        })),
        subtotal,
        updated_at: new Date().toISOString(),
        reminder_sent_at: null, // qualquer alteração no carrinho reinicia a contagem das 10h
      }, { onConflict: "customer_id" });
    }, 3000); // espera 3s de calma antes de gravar, para não gravar a cada clique

    return () => clearTimeout(timeoutRef.current);
  }, [user, items, subtotal]);
}
