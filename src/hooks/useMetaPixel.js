import { useEffect, useRef } from "react";

/**
 * Injeta o Meta Pixel (Facebook/Instagram Ads) — adiado até a página estar
 * pronta, tal como já fazemos com o Google Ads, para não competir com o
 * primeiro desenho da página.
 */
export function useMetaPixel(pixelId, marketingConsent) {
  const injected = useRef(false);

  useEffect(() => {
    if (!pixelId || !marketingConsent || injected.current) return;
    injected.current = true;

    const inject = () => {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
    };

    if (document.readyState === "complete") {
      const timer = setTimeout(inject, 1200);
      return () => clearTimeout(timer);
    }
    const onLoad = () => setTimeout(inject, 1200);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [pixelId, marketingConsent]);
}

/**
 * Regista uma compra — chamar na página de confirmação, quando o
 * pagamento for confirmado. Não faz nada se o pixel ainda não tiver
 * carregado (ex: encomenda confirmada muito depressa).
 */
export function trackMetaPurchase(value, orderNumber) {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "Purchase", {
    value: Number(value),
    currency: "EUR",
    content_ids: [orderNumber],
  });
}

/**
 * Regista "Adicionar ao carrinho" — chamar sempre que um produto é
 * adicionado, de qualquer página. Ajuda o Facebook a criar públicos de
 * remarketing (quem quase comprou, mas não chegou a finalizar).
 */
export function trackMetaAddToCart(product, value) {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: Number(value),
    currency: "EUR",
  });
}
