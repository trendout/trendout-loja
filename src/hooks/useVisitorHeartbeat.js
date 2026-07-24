import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "./useCart";

function getSessionId() {
  let id = sessionStorage.getItem("trendout_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("trendout_session_id", id);
  }
  return id;
}

// Localização aproximada (cidade/país) a partir do IP público — só se pede
// uma vez por sessão (fica em cache), nunca identifica a pessoa, só a zona
// geográfica de onde está a aceder.
export async function getApproxLocation() {
  const cached = sessionStorage.getItem("trendout_geo");
  if (cached) return JSON.parse(cached);

  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("geo lookup failed");
    const data = await res.json();
    const geo = {
      city: data.city || null,
      country: data.country_name || null,
      countryCode: data.country_code || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };
    sessionStorage.setItem("trendout_geo", JSON.stringify(geo));
    return geo;
  } catch {
    return { city: null, country: null, countryCode: null, latitude: null, longitude: null };
  }
}

export function useVisitorHeartbeat(analyticsConsent) {
  const location = useLocation();
  const { items, subtotal } = useCart();
  const geoRef = useRef(null);

  useEffect(() => {
    if (!analyticsConsent) return;
    let cancelled = false;
    let interval;

    async function beat() {
      if (!geoRef.current) geoRef.current = await getApproxLocation();
      if (cancelled) return;

      const cartStatus = location.pathname.startsWith("/carrinho") || location.pathname.startsWith("/checkout")
        ? "checkout"
        : items.length > 0 ? "has_cart" : "browsing";

      await supabase.from("visitor_sessions").upsert({
        session_id: getSessionId(),
        city: geoRef.current.city,
        country: geoRef.current.country,
        country_code: geoRef.current.countryCode,
        latitude: geoRef.current.latitude,
        longitude: geoRef.current.longitude,
        current_page: location.pathname,
        cart_status: cartStatus,
        cart_value: items.length > 0 ? subtotal : null,
        last_seen: new Date().toISOString(),
      }, { onConflict: "session_id" });
    }

    beat();
    interval = setInterval(beat, 10000); // a cada 10 segundos

    return () => { cancelled = true; clearInterval(interval); };
  }, [location.pathname, items.length, subtotal, analyticsConsent]);
}
