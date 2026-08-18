import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useCustomerAuth } from "./useCustomerAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Tal como o useCartSync, mas para visitantes SEM conta — identificados só
 * pelo email que escrevem no checkout (não por customer_id). Assim
 * conseguimos avisar por email quem tem o carrinho cheio mas nunca chega
 * a terminar a compra, mesmo sem ter criado conta.
 */
export function useGuestCartSync(email, items, subtotal) {
  const { user } = useCustomerAuth();
  const timeoutRef = useRef(null);
  const lastSyncedEmail = useRef(null);

  useEffect(() => {
    if (user) return; // já tratado pelo useCartSync, para clientes com conta
    if (!email || !EMAIL_RE.test(email)) return;
    if (items.length === 0) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      await supabase.from("cart_snapshots").upsert({
        customer_id: null,
        customer_email: email,
        items: items.map((i) => ({
          name: i.name, slug: i.slug, size: i.size, color: i.color, price: i.price, qty: i.qty, image: i.image, productId: i.productId,
        })),
        subtotal,
        updated_at: new Date().toISOString(),
        reminder_sent_at: null,
      }, { onConflict: "customer_email" });
      lastSyncedEmail.current = email;
    }, 2000); // espera 2s de calma depois de escrever, antes de gravar

    return () => clearTimeout(timeoutRef.current);
  }, [user, email, items, subtotal]);

  // se o carrinho ficar vazio (comprou, ou esvaziou) e já tínhamos um email
  // guardado, apaga esse registo — deixa de contar como abandonado
  useEffect(() => {
    if (user || items.length > 0 || !lastSyncedEmail.current) return;
    supabase.from("cart_snapshots").delete().eq("customer_email", lastSyncedEmail.current).is("customer_id", null);
    lastSyncedEmail.current = null;
  }, [user, items.length]);
}
