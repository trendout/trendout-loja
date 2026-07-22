import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T } from "../lib/theme";
import { useHeroSlides } from "../hooks/useHeroSlides";

export default function HeroCarousel() {
  const { slides } = useHeroSlides();
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides, index]);

  const go = (dir) => {
    clearInterval(timerRef.current);
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  const slide = slides[index] || slides[0];
  if (!slide) return null;

  return (
    <div
      style={{
        position: "relative", height: "min(70vh, 560px)", display: "flex", alignItems: "flex-end", overflow: "hidden",
        backgroundImage: slide.imageUrl
          ? `linear-gradient(180deg, rgba(15,18,16,0.15), rgba(15,18,16,0.85)), url(${slide.imageUrl})`
          : `linear-gradient(180deg, rgba(15,18,16,0.15), rgba(15,18,16,0.85))`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: T.bgRaised,
      }}
    >
      <div style={{ position: "relative", zIndex: 2, padding: "0 24px 64px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {slide.eyebrow && (
          <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            {slide.eyebrow}
          </div>
        )}
        <h1 style={{ fontFamily: T.fontHeading, fontSize: "clamp(40px, 7vw, 72px)", letterSpacing: 0.5, margin: "0 0 22px", color: T.text, lineHeight: 1 }}>
          {slide.title}
        </h1>
        {slide.ctaLabel && (
          <Link to={slide.href || "/"} style={{ display: "inline-block", background: T.accent, color: T.bg, fontWeight: 700, fontSize: 14, padding: "14px 30px", borderRadius: 8, textDecoration: "none" }}>
            {slide.ctaLabel}
          </Link>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <div style={{ position: "absolute", top: "50%", left: 20, transform: "translateY(-50%)", zIndex: 3 }}>
            <button onClick={() => go(-1)} style={{ background: "rgba(15,18,16,0.5)", border: `1px solid ${T.border}`, borderRadius: "50%", width: 40, height: 40, color: T.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={18} />
            </button>
          </div>
          <div style={{ position: "absolute", top: "50%", right: 20, transform: "translateY(-50%)", zIndex: 3 }}>
            <button onClick={() => go(1)} style={{ background: "rgba(15,18,16,0.5)", border: `1px solid ${T.border}`, borderRadius: "50%", width: 40, height: 40, color: T.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 3, display: "flex", gap: 8 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { clearInterval(timerRef.current); setIndex(i); }}
                aria-label={`Ver imagem ${i + 1} de ${slides.length}`}
                style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, border: "none", background: i === index ? T.accent : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "width .2s" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
