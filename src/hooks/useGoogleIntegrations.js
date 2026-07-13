import { useEffect, useRef } from "react";

export function useGoogleIntegrations(info) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    if (!info?.googleSiteVerification && !info?.enableGoogleAds) return;
    injected.current = true;

    if (info.googleSiteVerification) {
      const meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = info.googleSiteVerification;
      document.head.appendChild(meta);
    }

    if (info.enableGoogleAds && info.googleAdsConversionId) {
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${info.googleAdsConversionId}`;
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${info.googleAdsConversionId}');
      `;
      document.head.appendChild(s2);
    }
  }, [info?.googleSiteVerification, info?.enableGoogleAds, info?.googleAdsConversionId]);
}

/**
 * Chama isto na página de confirmação de encomenda para registar uma conversão no Google Ads.
 * Ainda não está ligado a nenhuma página — é o próximo passo depois de teres o Conversion ID/Label.
 */
export function trackGoogleAdsConversion(info, value, orderNumber) {
  if (!info?.enableGoogleAds || !info?.googleAdsConversionId || !info?.googleAdsConversionLabel) return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {
    send_to: `${info.googleAdsConversionId}/${info.googleAdsConversionLabel}`,
    value,
    currency: "EUR",
    transaction_id: orderNumber,
  });
}
