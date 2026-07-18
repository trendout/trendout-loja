import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T } from "../lib/theme";

export default function ProductGallery({ images, productName }) {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [null];

  const go = (dir) => setIndex((i) => (i + dir + list.length) % list.length);

  return (
    <div>
      <div style={{ position: "relative", aspectRatio: "1/1", background: T.bgRaised, borderRadius: 12, overflow: "hidden" }}>
        {list[index] ? (
          <img src={list[index]} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>Sem imagem</div>
        )}

        {list.length > 1 && (
          <>
            <button onClick={() => go(-1)} style={{ position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)", background: "rgba(15,18,16,0.6)", border: `1px solid ${T.border}`, borderRadius: "50%", width: 36, height: 36, color: T.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => go(1)} style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", background: "rgba(15,18,16,0.6)", border: `1px solid ${T.border}`, borderRadius: "50%", width: 36, height: 36, color: T.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={16} />
            </button>
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
              {list.map((_, i) => (
                <span key={i} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, background: i === index ? T.accent : "rgba(255,255,255,0.4)", transition: "width .2s" }} />
              ))}
            </div>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 60, height: 60, borderRadius: 8, overflow: "hidden", padding: 0, cursor: "pointer",
                border: `2px solid ${i === index ? T.accent : T.border}`, background: T.bgRaised,
              }}
            >
              {img && <img src={img} alt={`${productName} — foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
