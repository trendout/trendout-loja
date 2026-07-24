import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Identifica a sessão do visitante (dura só enquanto o separador estiver aberto) —
// serve só para distinguirmos visitantes diferentes, não identifica ninguém.
function getSessionId() {
  let id = sessionStorage.getItem("trendout_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("trendout_session_id", id);
  }
  return id;
}

export function useTrackPageView(analyticsConsent) {
  const location = useLocation();

  useEffect(() => {
    if (!analyticsConsent) return;
    supabase.from("page_views").insert({
      path: location.pathname,
      session_id: getSessionId(),
      referrer: document.referrer || null,
    }).then(({ error }) => {
      if (error) console.error("Erro ao registar visita:", error.message);
    });
  }, [location.pathname, analyticsConsent]);
}
