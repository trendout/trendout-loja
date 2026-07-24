import { useEffect, useRef } from "react";

export function useGoogleIntegrations(info, marketingConsent) {
  const injected = useRef(false);
  const verificationInjected = useRef(false);

  // a meta tag de verificação do site não é rastreio nenhum — não precisa de consentimento
  useEffect(() => {
    if (verificationInjected.current || !info?.googleSiteVerification) return;
    verificationInjected.current = true;
    const meta = document.createElement("meta");
    meta.name = "google-site-verification";
    meta.content = info.googleSiteVerification;
    document.head.appendChild(meta);
  }, [info?.googleSiteVerification]);

  useEffect(() => {
    if (injected.current) return;
    if (!marketingConsent) return; // só corre depois de o cliente aceitar cookies de marketing
    if (!info?.enableGoogleAds || !info?.googleAdsConversionId) return;
    injected.current = true;

    const inject = () => {
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
    };

    // adiada até a página estar pronta, para não competir com o primeiro desenho
    if (document.readyState === "complete") {
      const timer = setTimeout(inject, 1000);
      return () => clearTimeout(timer);
    }
    const onLoad = () => setTimeout(inject, 1000);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [marketingConsent, info?.enableGoogleAds, info?.googleAdsConversionId]);
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
