import React, { useState } from "react";
import { Cookie } from "lucide-react";
import { T } from "../lib/theme";
import { useCookieConsent } from "../hooks/useCookieConsent";

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 40, height: 22, borderRadius: 999, border: "none", position: "relative", cursor: disabled ? "default" : "pointer",
        background: checked ? T.accent : T.border, transition: "background .15s", flexShrink: 0, opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ position: "absolute", top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: disabled ? "#9aa39a" : T.bg, transition: "left .15s" }} />
    </button>
  );
}

function SettingsPanel({ onClose }) {
  const { consent, savePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 480, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <h3 style={{ fontFamily: T.fontHeading, fontSize: 20, margin: "0 0 6px" }}>Definições de cookies</h3>
        <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 20px", lineHeight: 1.5 }}>
          Escolhe que tipos de cookies aceitas. Podes mudar isto sempre que quiseres, no rodapé da loja.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Necessários</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Carrinho, sessão de conta, segurança — a loja não funciona sem eles.</div>
            </div>
            <Toggle checked={true} disabled onChange={() => {}} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Análises</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Ajudam-nos a perceber que páginas visitas, para melhorarmos a loja.</div>
            </div>
            <Toggle checked={analytics} onChange={setAnalytics} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Marketing</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Google Ads e Meta (Facebook/Instagram), para anúncios mais relevantes.</div>
            </div>
            <Toggle checked={marketing} onChange={setMarketing} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "none", border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "12px 0", cursor: "pointer", fontSize: 13.5 }}>
            Cancelar
          </button>
          <button
            onClick={() => savePreferences({ analytics, marketing })}
            style={{ flex: 1, background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "12px 0", cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CookieBanner() {
  const { hasDecided, acceptAll, rejectAll, settingsOpen, openSettings, closeSettings } = useCookieConsent();

  if (settingsOpen) return <SettingsPanel onClose={closeSettings} />;
  if (hasDecided) return null;

  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 600,
      background: T.bgRaised, borderTop: `1px solid ${T.border}`, padding: "18px 20px",
      paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
      boxShadow: "0 -8px 30px rgba(0,0,0,0.4)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: "1 1 320px" }}>
          <Cookie size={20} color={T.accent} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: "#cfd3cd", margin: 0, lineHeight: 1.5 }}>
            Usamos cookies necessários para a loja funcionar, e (só com a tua autorização) cookies de análises e marketing para melhorarmos a experiência e os anúncios.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
          <button onClick={openSettings} style={{ background: "none", border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
            Personalizar
          </button>
          <button onClick={rejectAll} style={{ background: "none", border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
            Rejeitar não essenciais
          </button>
          <button onClick={acceptAll} style={{ background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
