import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck, AlertCircle, Heart } from "lucide-react";
import { T } from "../lib/theme";
import { colorToHex } from "../lib/colors";
import { useProduct } from "../hooks/useProduct";
import { useRelatedProducts } from "../hooks/useRelatedProducts";
import { useStoreInfo } from "../hooks/useStoreInfo";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";
import ProductGallery from "../components/ProductGallery";
import ProductCard from "../components/ProductCard";
import Layout from "../components/Layout";

export default function ProductPage({ slug }) {
  const { product, loading, error } = useProduct(slug);
  const { info } = useStoreInfo();
  const { products: related } = useRelatedProducts(product?.category, product?.id, 4);
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite, loggedIn } = useFavorites();
  const navigate = useNavigate();

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const colors = useMemo(() => product ? [...new Set(product.variants.map((v) => v.color).filter(Boolean))] : [], [product]);
  const activeColor = selectedColor || colors[0];
  const sizesForColor = useMemo(
    () => product ? product.variants.filter((v) => !activeColor || v.color === activeColor) : [],
    [product, activeColor]
  );
  const activeSize = selectedSize || sizesForColor.find((v) => v.stock > 0)?.size || sizesForColor[0]?.size;
  const activeVariant = sizesForColor.find((v) => v.size === activeSize);

  useEffect(() => {
    if (activeVariant && qty > activeVariant.stock) setQty(Math.max(1, activeVariant.stock));
  }, [activeVariant]); // eslint-disable-line

  if (loading) return <Layout><div style={{ color: T.muted, padding: 60, textAlign: "center" }}>A carregar produto...</div></Layout>;
  if (error || !product) return <Layout><div style={{ color: T.danger, padding: 60, textAlign: "center" }}>Produto não encontrado.</div></Layout>;

  const isUnavailable = product.availability === "unavailable";
  const isOutOfStock = product.availability === "out_of_stock" || product.variants.every((v) => v.stock === 0);
  const showPurchaseBlock = !isUnavailable;

  const stockNote = () => {
    if (!activeVariant) return "Escolhe um tamanho";
    if (activeVariant.stock === 0) return "Esgotado neste tamanho";
    if (activeVariant.stock <= 3) return `Últimas unidades — só ${activeVariant.stock} em stock`;
    return `Em stock — ${activeVariant.stock} unidades disponíveis, envio em 24h`;
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px 0" }}>
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 20 }}>
          <Link to="/" style={{ color: T.muted, textDecoration: "none" }}>Home</Link>
          <span style={{ opacity: 0.4 }}> / </span>
          <Link to={`/categoria/${encodeURIComponent(product.topCategory)}`} style={{ color: T.muted, textDecoration: "none" }}>{product.topCategory}</Link>
          <span style={{ opacity: 0.4 }}> / </span>
          <Link to={`/categoria/${encodeURIComponent(product.category)}`} style={{ color: T.muted, textDecoration: "none" }}>{product.category}</Link>
          <span style={{ opacity: 0.4 }}> / </span>
          <span style={{ color: T.text }}>{product.name}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <ProductGallery images={product.images} productName={product.name} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.muted, marginBottom: 8 }}>
              <span>{product.brand || "Trendout"}</span>
              {product.reference && <span>Ref. {product.reference}{activeColor ? `-${activeColor.slice(0, 3).toUpperCase()}` : ""}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <h1 style={{ fontFamily: T.fontHeading, fontSize: 30, letterSpacing: 0.5, margin: "0 0 14px" }}>{product.name}</h1>
              <button
                onClick={() => { if (!loggedIn) { navigate("/conta"); return; } toggleFavorite(product.id); }}
                aria-label="Adicionar aos favoritos"
                style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Heart size={18} color={isFavorite(product.id) ? T.danger : T.muted} fill={isFavorite(product.id) ? T.danger : "none"} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: product.compareAtPrice ? T.accent : T.text }}>€{product.basePrice.toFixed(2)}</span>
              {product.compareAtPrice && <span style={{ fontSize: 16, color: T.muted, textDecoration: "line-through" }}>€{product.compareAtPrice.toFixed(2)}</span>}
            </div>

            {product.couponCode && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(201,255,63,0.08)", border: `1px solid ${T.accent}55`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                <span>Cupão disponível para este produto:</span>
                <span style={{ fontWeight: 700, color: T.accent, letterSpacing: 0.5 }}>{product.couponCode}</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: T.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              <Truck size={16} style={{ color: T.accent, flexShrink: 0, marginTop: 1 }} />
              <span>
                Portes grátis em encomendas acima de €{info.freeShippingThreshold || 40} · esta peça sozinha soma €{(product.basePrice * qty).toFixed(2)}
              </span>
            </div>

            {isUnavailable ? (
              <div style={{ padding: 18, borderRadius: 12, background: "rgba(255,107,94,0.08)", border: `1px solid ${T.danger}`, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <AlertCircle size={20} color={T.danger} />
                  <strong style={{ fontSize: 15 }}>Produto temporariamente indisponível</strong>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#cfd3cd", lineHeight: 1.5 }}>
                  Contacte-nos para mais informações ou para reservar o produto.
                </p>
                <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>
                  <div>{info.companyAddress}</div>
                  <div>{info.companyPhone} · {info.companyEmail}</div>
                </div>
              </div>
            ) : (
              <>
                {colors.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                      Cor — {activeColor}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {colors.map((c) => {
                        const hex = colorToHex(c);
                        return (
                          <button
                            key={c}
                            title={c}
                            onClick={() => { setSelectedColor(c); setSelectedSize(null); }}
                            style={{
                              width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
                              background: hex || T.bgRaised2, border: `2px solid ${c === activeColor ? T.accent : T.border}`,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Tamanho</span>
                    <a href="#" style={{ fontSize: 12.5, color: T.accent, textDecoration: "none" }}>Guia de tamanhos</a>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {sizesForColor.map((v) => {
                      const disabled = v.stock === 0;
                      const active = v.size === activeSize;
                      return (
                        <button
                          key={v.size}
                          disabled={disabled}
                          onClick={() => setSelectedSize(v.size)}
                          style={{
                            padding: "10px 16px", borderRadius: 8, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
                            border: `1px solid ${active ? T.accent : T.border}`,
                            background: active ? "rgba(201,255,63,0.1)" : "none",
                            color: disabled ? T.muted : active ? T.accent : T.text,
                            opacity: disabled ? 0.4 : 1,
                            textDecoration: disabled ? "line-through" : "none",
                          }}
                        >
                          {v.size}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12.5, color: activeVariant?.stock <= 3 ? T.warn : T.muted }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: activeVariant?.stock === 0 ? T.danger : activeVariant?.stock <= 3 ? T.warn : T.accent }} />
                    {stockNote()}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 8 }}>
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ background: "none", border: "none", color: T.text, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>−</button>
                    <span style={{ width: 32, textAlign: "center", fontSize: 14 }}>{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(q + 1, activeVariant?.stock || 1))} style={{ background: "none", border: "none", color: T.text, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>+</button>
                  </div>
                </div>

                <button
                  disabled={!activeVariant || activeVariant.stock === 0}
                  onClick={() => {
                    addItem(product, activeVariant, qty);
                    setAdded(true);
                    setTimeout(() => setAdded(false), 2000);
                  }}
                  style={{
                    width: "100%", padding: "15px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14.5,
                    border: "none", cursor: activeVariant?.stock ? "pointer" : "not-allowed",
                    background: activeVariant?.stock ? T.accent : T.bgRaised2,
                    color: activeVariant?.stock ? T.bg : T.muted, marginBottom: 10,
                  }}
                >
                  {activeVariant?.stock ? (added ? "Adicionado ✓" : "Adicionar ao carrinho") : "Esgotado"}
                </button>
                {added && (
                  <div style={{ marginBottom: 18 }}>
                    <Link to="/carrinho" style={{ color: T.accent, fontSize: 13, textDecoration: "none" }}>Ver carrinho e finalizar compra →</Link>
                  </div>
                )}
              </>
            )}

            {product.description && (
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 22 }}>
                <h2 style={{ fontFamily: T.fontHeading, fontSize: 18, margin: "0 0 12px" }}>Descrição</h2>
                <p style={{ fontSize: 13.5, color: "#cfd3cd", lineHeight: 1.7, margin: "0 0 14px" }}>{product.description}</p>
                {product.features.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "#cfd3cd", lineHeight: 1.9 }}>
                    {product.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "56px auto 0", padding: "40px 24px", borderTop: `1px solid ${T.border}` }}>
          <h2 style={{ fontFamily: T.fontHeading, fontSize: 22, margin: "0 0 4px" }}>Quem comprou este produto, comprou também:</h2>
          <p style={{ color: T.muted, fontSize: 13, margin: "0 0 24px" }}>Recomendado com base em compras de outros clientes</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 780px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
