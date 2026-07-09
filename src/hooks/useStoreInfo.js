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
        theme: data.theme || DEFAULT_THEME,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { info: info || { theme: DEFAULT_THEME }, loading };
}
