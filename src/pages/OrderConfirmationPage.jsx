import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { T } from "../lib/theme";
import { supabase } from "../lib/supabase";
import { useCart } from "../hooks/useCart";
import Layout from "../components/Layout";

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order");
  const { clear } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // o webhook do Stripe pode demorar 1-2 segundos a confirmar o pagamento — tentamos
    // algumas vezes antes de desistir, para o cliente já ver o estado "Confirmada"
    let attempts = 0;
    let cancelled = false;

    async function poll() {
      if (!orderNumber) { setLoading(false); return; }
      const { data } = await supabase.from("orders").select("*").eq("order_number", orderNumber).single();
      if (cancelled) return;

      if (data && (data.payment_status === "paid" || attempts >= 5)) {
        setOrder(data);
        setLoading(false);
        clear(); // esvazia o carrinho só depois de confirmarmos a encomenda
        return;
      }
      attempts += 1;
      setTimeout(poll, 1500);
    }

    poll();
    return () => { cancelled = true; };
  }, [orderNumber]); // eslint-disable-line

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", minHeight: "50vh" }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          {loading ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, margin: "0 0 12px" }}>A confirmar o teu pagamento...</h1>
              <p style={{ color: T.muted, fontSize: 13.5 }}>Só demora um instante.</p>
            </>
          ) : order?.payment_status === "paid" ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, margin: "0 0 12px" }}>Pagamento confirmado!</h1>
              <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
                Encomenda <strong style={{ color: T.accent }}>{order.order_number}</strong> — obrigado pela tua compra.
              </p>
              <a href="/conta" style={{ color: T.accent, textDecoration: "none", fontSize: 13.5 }}>Ver as minhas encomendas →</a>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, margin: "0 0 12px" }}>Ainda a processar</h1>
              <p style={{ color: T.muted, fontSize: 13.5, marginBottom: 20 }}>
                O teu pagamento está a ser confirmado. Se não vires a atualização em breve, contacta-nos com o número da encomenda.
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
