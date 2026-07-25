import { useEffect, useRef } from "react";

/**
 * Injeta o Google Analytics 4 — só depois do cliente aceitar cookies de
 * "Análises" (não é a mesma categoria do Google Ads/Meta, que são
 * "Marketing"). Adiado até a página estar pronta, tal como os outros.
 */
export function useGA4(measurementId, analyticsConsent) {
  const injected = useRef(false);

  useEffect(() => {
    if (!measurementId || !analyticsConsent || injected.current) return;
    injected.current = true;

    const inject = () => {
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(s2);
    };

    if (document.readyState === "complete") {
      const timer = setTimeout(inject, 1000);
      return () => clearTimeout(timer);
    }
    const onLoad = () => setTimeout(inject, 1000);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [measurementId, analyticsConsent]);
}

/**
 * Regista uma compra no GA4 — chamar na página de confirmação, quando o
 * pagamento for confirmado. Não faz nada se o GA4 ainda não tiver
 * carregado (ex: sem consentimento de análises, ou ainda a carregar).
 */
export function trackGA4Purchase(value, orderNumber) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "purchase", {
    transaction_id: orderNumber,
    value: Number(value),
    currency: "EUR",
  });
}

/**
 * Regista "Adicionar ao carrinho" no GA4 — chamar sempre que um produto é
 * adicionado, de qualquer página.
 */
export function trackGA4AddToCart(product, value) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "add_to_cart", {
    currency: "EUR",
    value: Number(value),
    items: [{ item_id: product.id, item_name: product.name, price: product.basePrice }],
  });
}
