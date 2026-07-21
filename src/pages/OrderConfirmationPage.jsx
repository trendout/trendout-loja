import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { T } from "../lib/theme";
import { supabase } from "../lib/supabase";
import { useCart } from "../hooks/useCart";
import { useSeo } from "../hooks/useSeo";
import { useStoreInfo } from "../hooks/useStoreInfo";
import { trackGoogleAdsConversion } from "../hooks/useGoogleIntegrations";
import Layout from "../components/Layout";

export default function OrderConfirmationPage() {
  useSeo({ title: "Encomenda confirmada — Trendout", noindex: true });
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order");
  const { clear } = useCart();
  const { info } = useStoreInfo();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const trackedRef = useRef(false);

  useEffect(() => {
    // o webhook do Stripe pode demorar 1-2 segundos a confirmar o pagamento — tentamos
    // algumas vezes antes de desistir, para o cliente já ver o estado "Confirmada".
    // Usamos uma Edge Function (não lemos a tabela diretamente) porque um cliente
    // convidado, sem sessão, não tem permissão para ler encomendas por segurança.
    let attempts = 0;
    let cancelled = false;

    async function poll() {
      if (!orderNumber) { setLoading(false); return; }

      const { data, error } = await supabase.functions.invoke("get-order-status", {
        body: { orderNumber },
      });

      if (cancelled) return;

      if (!error && data && (data.payment_status === "paid" || attempts >= 5)) {
        setOrder(data);
        setLoading(false);
        clear(); // esvazia o carrinho só depois de confirmarmos a encomenda
        return;
      }
      attempts += 1;
      if (attempts >= 6) {
        // desiste de vez ao fim de umas tentativas, mesmo sem confirmação — evita ficar preso para sempre
        setOrder(data || null);
        setLoading(false);
        return;
      }
      setTimeout(poll, 1500);
    }

    poll();
    return () => { cancelled = true; };
  }, [orderNumber]); // eslint-disable-line

  useEffect(() => {
    if (trackedRef.current) return;
    if (order?.payment_status === "paid" && info) {
      trackGoogleAdsConversion(info, Number(order.total), order.order_number);
      trackedRef.current = true;
    }
  }, [order, info]);

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", minHeight: "50vh" }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          {loading ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <h1 style={{ fontFamily: T.fontHeading, fontSize: 24, margin: "0 0 12px" }}>A confirmar o teu pagamento...</h1>
              <p style={{ color: T.muted, fontSize: 13.5 }}>Só demora um instante.</p>
            </>
          ) : order?.payment_status === "paid" ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
              <h1 style={{ fontFamily: T.fontHeading, fontSize: 28, margin: "0 0 12px" }}>Pagamento confirmado!</h1>
              <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
                Encomenda <strong style={{ color: T.accent }}>{order.order_number}</strong> — obrigado pela tua compra.
              </p>
              <Link to="/conta" style={{ color: T.accent, textDecoration: "none", fontSize: 13.5 }}>Ver as minhas encomendas →</Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
              <h1 style={{ fontFamily: T.fontHeading, fontSize: 24, margin: "0 0 12px" }}>Ainda a processar</h1>
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
