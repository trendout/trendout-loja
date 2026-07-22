import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { T } from "../lib/theme";
import { colorToHex } from "../lib/colors";
import { useFavorites } from "../hooks/useFavorites";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, loggedIn } = useFavorites();
  const favorited = isFavorite(product.id);
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const isUnavailable = product.availability === "unavailable";
  const isOutOfStock = product.availability === "out_of_stock" || totalStock === 0;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) { navigate("/conta"); return; }
    toggleFavorite(product.id);
  };

  return (
    <Link to={`/produto/${product.slug}`} style={{ textDecoration: "none", color: T.text, display: "block" }}>
      <div style={{ position: "relative", aspectRatio: "3/4", background: T.bgRaised, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 12 }}>Sem imagem</div>
        )}
        <button
          onClick={handleFavoriteClick}
          aria-label="Adicionar aos favoritos"
          style={{
            position: "absolute", bottom: 10, right: 10, width: 30, height: 30, borderRadius: "50%",
            background: "rgba(15,18,16,0.6)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Heart size={15} color={favorited ? T.danger : "#fff"} fill={favorited ? T.danger : "none"} />
        </button>
        {product.compareAtPrice && (
          <span style={{ position: "absolute", top: 10, left: 10, background: T.accent, color: T.bg, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
            PROMO
          </span>
        )}
        {product.compareAtPrice && !isUnavailable && !isOutOfStock && (
          <span style={{ position: "absolute", top: 10, right: 10, background: T.danger, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
            −{Math.round((1 - product.basePrice / product.compareAtPrice) * 100)}%
          </span>
        )}
        {(isUnavailable || isOutOfStock) && (
          <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(15,18,16,0.85)", color: T.muted, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>
            {isUnavailable ? "Indisponível" : "Sem stock"}
          </span>
        )}
      </div>

      {product.brand && <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{product.brand}</div>}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{product.name}</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: product.compareAtPrice ? T.accent : T.text }}>€{product.basePrice.toFixed(2)}</span>
        {product.compareAtPrice && <span style={{ fontSize: 12.5, color: T.muted, textDecoration: "line-through" }}>€{product.compareAtPrice.toFixed(2)}</span>}
      </div>

      {colors.length > 0 && (
        <div style={{ display: "flex", gap: 4 }}>
          {colors.slice(0, 5).map((c) => {
            const hex = colorToHex(c);
            return (
              <span
                key={c}
                title={c}
                style={{
                  width: 13, height: 13, borderRadius: "50%",
                  background: hex || T.bgRaised2,
                  border: `1px solid ${T.border}`,
                }}
              />
            );
          })}
        </div>
      )}
    </Link>
  );
}
