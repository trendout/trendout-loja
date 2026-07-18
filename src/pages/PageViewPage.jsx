import React from "react";
import { T } from "../lib/theme";
import { usePageBySlug } from "../hooks/usePageBySlug";
import { useStoreInfo } from "../hooks/useStoreInfo";
import { useSeo, truncateForMeta } from "../hooks/useSeo";
import Layout from "../components/Layout";

export default function PageViewPage({ slug }) {
  const { page, loading, error } = usePageBySlug(slug);
  const { info } = useStoreInfo();

  const storeName = info.storeName || "Trendout";
  useSeo({
    title: page ? `${page.title} — ${storeName}` : `A carregar... — ${storeName}`,
    description: page
      ? page.metaDescription || truncateForMeta(page.content) || `${page.title} — ${storeName}.`
      : "",
  });

  if (loading) {
    return <Layout><div style={{ color: T.muted, padding: 60, textAlign: "center" }}>A carregar...</div></Layout>;
  }
  if (error || !page) {
    return <Layout><div style={{ color: T.danger, padding: 60, textAlign: "center" }}>Página não encontrada.</div></Layout>;
  }

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 16 }}>Home / {page.title}</div>

        {page.featuredImage && (
          <img
            src={page.featuredImage}
            alt={page.title}
            style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 12, marginBottom: 28 }}
          />
        )}

        <h1 style={{ fontFamily: T.fontHeading, fontSize: 36, letterSpacing: 0.5, margin: "0 0 24px" }}>
          {page.title}
        </h1>

        <div
          className="page-content"
          style={{ fontSize: 15, lineHeight: 1.8, color: "#cfd3cd" }}
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>

      <style>{`
        .page-content h2 { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: ${T.text}; margin: 28px 0 12px; letter-spacing: 0.3px; }
        .page-content p { margin: 0 0 14px; }
        .page-content ul, .page-content ol { margin: 0 0 14px; padding-left: 22px; }
        .page-content a { color: ${T.accent}; }
        .page-content img { max-width: 100%; border-radius: 8px; margin: 14px 0; }
      `}</style>
    </Layout>
  );
}
