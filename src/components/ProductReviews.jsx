import React, { useState } from "react";
import { Star } from "lucide-react";
import { T } from "../lib/theme";
import { useProductReviews } from "../hooks/useProductReviews";

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
        >
          <Star size={24} fill={n <= (hover || value) ? T.accent : "none"} color={n <= (hover || value) ? T.accent : T.muted} />
        </button>
      ))}
    </div>
  );
}

function Stars({ rating, size = 14 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(rating) ? T.accent : "none"} color={n <= Math.round(rating) ? T.accent : T.muted} />
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, user }) {
  const { reviews, myReview, average, count, loading, submitReview } = useProductReviews(productId, user);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError("Escolhe uma classificação de 1 a 5 estrelas."); return; }
    setSubmitting(true);
    setError("");
    try {
      await submitReview(rating, comment.trim());
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err.message || "Erro ao enviar a avaliação.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: 48, borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
      <h2 style={{ fontFamily: T.fontHeading, fontSize: 24, margin: "0 0 16px" }}>Avaliações</h2>

      {count > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Stars rating={average} size={18} />
          <span style={{ fontSize: 14, color: T.muted }}>{average.toFixed(1)} de 5 · {count} avaliaç{count > 1 ? "ões" : "ão"}</span>
        </div>
      ) : (
        <p style={{ fontSize: 13.5, color: T.muted, marginBottom: 24 }}>Ainda sem avaliações — sê o primeiro a comprar e avaliar.</p>
      )}

      {reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.customerName}</span>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p style={{ fontSize: 13.5, color: "#cfd3cd", margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 8 }}>{new Date(r.createdAt).toLocaleDateString("pt-PT")}</div>
            </div>
          ))}
        </div>
      )}

      {!user ? (
        <p style={{ fontSize: 13, color: T.muted }}>Inicia sessão na tua conta para deixares uma avaliação.</p>
      ) : myReview ? (
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>
            {myReview.status === "pending" ? "A tua avaliação está a aguardar aprovação:" : myReview.status === "rejected" ? "A tua avaliação não foi aprovada:" : "A tua avaliação:"}
          </div>
          <Stars rating={myReview.rating} />
          {myReview.comment && <p style={{ fontSize: 13.5, color: "#cfd3cd", margin: "8px 0 0" }}>{myReview.comment}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Deixa a tua avaliação</div>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que achaste do produto? (opcional)"
            style={{ width: "100%", marginTop: 14, minHeight: 80, padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13.5, resize: "vertical", boxSizing: "border-box" }}
          />
          {error && <div style={{ color: T.danger, fontSize: 12.5, marginTop: 8 }}>{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{ marginTop: 14, background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "11px 22px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
          >
            {submitting ? "A enviar..." : "Enviar avaliação"}
          </button>
        </form>
      )}
    </div>
  );
}
