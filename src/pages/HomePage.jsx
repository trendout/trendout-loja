import React, { useState } from "react";
import { T } from "../lib/theme";
import { usePublicMenus } from "../hooks/usePublicMenus";
import { useStoreInfo } from "../hooks/useStoreInfo";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";
import HeroCarousel from "../components/HeroCarousel";
import CategorySection from "../components/CategorySection";

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return;
    const { error: err } = await supabase.from("newsletter_subscribers").insert({ email });
    if (err && !err.message.includes("duplicate")) {
      setError("Não foi possível subscrever. Tenta outra vez.");
      return;
    }
    setSent(true);
  };

  return (
    <section style={{ background: T.bgRaised, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Junta-te à comunidade
        </div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, margin: "0 0 18px" }}>
          Novidades e promoções em primeira mão
        </h2>
        {sent ? (
          <div style={{ color: T.accent, fontSize: 14 }}>Obrigado! Já estás na lista.</div>
        ) : (
          <form
            onSubmit={submit}
            style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="O teu email"
              style={{ padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, minWidth: 240, fontSize: 14 }}
            />
            <button type="submit" style={{ background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              Subscrever
            </button>
          </form>
        )}
        {error && <div style={{ color: T.danger, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { menus, loading } = usePublicMenus();
  const { info } = useStoreInfo();
  const mainNav = menus.main_nav || [];
  const topCategoryNames = [...new Set(mainNav.filter((i) => i.linkType === "category").map((i) => i.value))];

  return (
    <Layout>
      <HeroCarousel />

      {loading ? (
        <div style={{ textAlign: "center", color: T.muted, padding: 60 }}>A carregar...</div>
      ) : (
        <div style={{ paddingTop: 48 }}>
          {topCategoryNames.map((name) => <CategorySection key={name} title={name} limit={info.homepageProductsPerCategory || 8} />)}
        </div>
      )}

      <NewsletterSection />
    </Layout>
  );
}
