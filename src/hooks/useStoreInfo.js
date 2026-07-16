import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_THEME = { accentColor: "#c9ff3f", bgColor: "#0f1210", textColor: "#eef0ec", headingFont: "Bebas Neue", bodyFont: "Inter" };

export function useStoreInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }
      setInfo({
        storeName: data.store_name,
        freeShippingThreshold: Number(data.free_shipping_threshold),
        companyAddress: data.company_address,
        companyPhone: data.company_phone,
        companyEmail: data.company_email,
        companyNif: data.company_nif,
        showCompanyInfoFooter: data.show_company_info_footer,
        analyticsScripts: data.analytics_scripts || "",
        enableCardPayment: data.enable_card_payment,
        enableBankTransfer: data.enable_bank_transfer,
        companyIban: data.company_iban || "",
        paymentMethodsAccepted: data.payment_methods_accepted || [],
        enableStripe: data.enable_stripe,
        stripePublishableKey: data.stripe_publishable_key || "",
        enableMultibanco: data.enable_multibanco,
        multibancoEntity: data.multibanco_entity || "",
        enableMbway: data.enable_mbway,
        googleSiteVerification: data.google_site_verification || "",
        enableGoogleAds: data.enable_google_ads,
        googleAdsConversionId: data.google_ads_conversion_id || "",
        googleAdsConversionLabel: data.google_ads_conversion_label || "",
        homepageProductsPerCategory: data.homepage_products_per_category ?? 8,
        maintenanceModeEnabled: data.maintenance_mode_enabled,
        maintenanceMessage: data.maintenance_message || "",
        announcementEnabled: data.announcement_enabled,
        announcementMessage: data.announcement_message || "",
        loyaltyPointsEnabled: data.loyalty_points_enabled,
        pointsPerEuroSpent: data.points_per_euro_spent ?? 2,
        pointsPerEuroDiscount: data.points_per_euro_discount ?? 100,
        theme: data.theme || DEFAULT_THEME,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { info: info || { theme: DEFAULT_THEME }, loading };
}
