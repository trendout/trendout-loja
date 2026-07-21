import React, { useState, useEffect } from "react";
import { X, Copy, Check, Tag } from "lucide-react";
import { T } from "../lib/theme";
import { supabase } from "../lib/supabase";

const DISMISS_KEY = "trendout_promo_popup_dismissed";
const SUBSCRIBED_KEY = "trendout_promo_popup_subscribed";

export default function PromoPopup({ message, couponCode }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const alreadyHandled = sessionStorage.getItem(DISMISS_KEY) || localStorage.getItem(SUBSCRIBED_KEY);
    if (alreadyHandled) return;
    const timer = setTimeout(() => setVisible(true), 2500); // pequena pausa antes de aparecer, menos intrusivo
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const { error: err } = await supabase.from("newsletter_subscribers").insert({
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        source: "popup",
      });
      if (err && !err.message.includes("duplicate")) throw err;
      localStorage.setItem(SUBSCRIBED_KEY, "1");
      setDone(true);
    } catch (err) {
      setError("Não foi possível concluir. Tenta outra vez.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 380, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 16, padding: "36px 28px 28px", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: T.muted, cursor: "pointer", display: "flex" }}
        >
          <X size={18} />
        </button>

        {!done ? (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(201,255,63,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Tag size={22} color={T.accent} />
            </div>
            <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, margin: "0 0 20px", whiteSpace: "pre-line" }}>
              {message}
            </p>
            <form onSubmit={submit}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="O teu email"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }}
              />
              <input
                name="tel"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telemóvel (opcional)"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 14, marginBottom: 14, boxSizing: "border-box" }}
              />
              {error && <div style={{ color: T.danger, fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
              <button
                type="submit"
                disabled={submitting}
                style={{ width: "100%", background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                {submitting ? "A processar..." : "Quero o meu desconto"}
              </button>
            </form>
            <button onClick={dismiss} style={{ background: "none", border: "none", color: T.muted, fontSize: 12, marginTop: 14, cursor: "pointer", textDecoration: "underline" }}>
              Agora não
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontFamily: T.fontHeading, fontSize: 20, margin: "0 0 14px" }}>Obrigado!</h3>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Usa este código no checkout:</p>
            <button
              onClick={copyCoupon}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: T.bg, border: `1px dashed ${T.accent}`, borderRadius: 8, padding: "14px 0", cursor: "pointer", marginBottom: 16 }}
            >
              <span style={{ fontWeight: 700, fontSize: 17, color: T.accent, letterSpacing: 1 }}>{couponCode}</span>
              {copied ? <Check size={16} color={T.accent} /> : <Copy size={16} color={T.muted} />}
            </button>
            <button onClick={dismiss} style={{ width: "100%", background: "none", border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "12px 0", cursor: "pointer", fontSize: 13.5 }}>
              Continuar a comprar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
