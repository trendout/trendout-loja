import React from "react";
import { Link } from "react-router-dom";
import { T } from "../lib/theme";
import { useCategoryProducts } from "../hooks/useCategoryProducts";
import ProductCard from "./ProductCard";

export default function CategorySection({ title, limit = 8 }) {
  const { products, loading } = useCategoryProducts(title, limit);

  if (!loading && products.length === 0) return null;

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 56px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 0.5, margin: 0 }}>{title}</h2>
        <Link to={`/categoria/${encodeURIComponent(title)}`} className="hover-accent" style={{ color: T.muted, fontSize: 13, textDecoration: "none" }}>Ver tudo →</Link>
      </div>
      {loading ? (
        <div style={{ color: T.muted, fontSize: 13 }}>A carregar...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
