import React, { useState, useMemo } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { T } from "../lib/theme";
import { colorToHex } from "../lib/colors";
import { useCollectionBySlug } from "../hooks/useCollectionBySlug";
import { useStoreInfo } from "../hooks/useStoreInfo";
import { useSeo, truncateForMeta } from "../hooks/useSeo";
import ProductCard from "../components/ProductCard";
import Layout from "../components/Layout";

const SORT_OPTIONS = [
  { key: "relevance", label: "Relevância" },
  { key: "price_asc", label: "Preço: mais baixo primeiro" },
  { key: "price_desc", label: "Preço: mais alto primeiro" },
  { key: "name_asc", label: "Nome: A-Z" },
];

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, padding: "18px 0" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", color: T.text, cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}
      >
        {title}
        <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

export default function CollectionViewPage({ slug }) {
  const { collection, products, loading, error } = useCollectionBySlug(slug);
  const { info } = useStoreInfo();

  const storeName = info.storeName || "Trendout";
  useSeo({
    title: collection ? `${collection.name} — ${storeName}` : `A carregar... — ${storeName}`,
    description: collection
      ? truncateForMeta(collection.description) || `Descobre a coleção ${collection.name} na ${storeName}.`
      : "",
  });

  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceMax, setPriceMax] = useState(null);
  const [sort, setSort] = useState("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { allSizes, allColors, allBrands, maxPricePossible } = useMemo(() => {
    const sizes = new Set(), colors = new Set(), brands = new Set();
    let maxPrice = 0;
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.size) sizes.add(v.size);
        if (v.color) colors.add(v.color);
      });
      if (p.brand) brands.add(p.brand);
      maxPrice = Math.max(maxPrice, p.basePrice);
    });
    return {
      allSizes: [...sizes],
      allColors: [...colors],
      allBrands: [...brands],
      maxPricePossible: Math.ceil(maxPrice) || 100,
    };
  }, [products]);

  const effectivePriceMax = priceMax ?? maxPricePossible;

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (selectedSizes.length && !p.variants.some((v) => selectedSizes.includes(v.size))) return false;
      if (selectedColors.length && !p.variants.some((v) => selectedColors.includes(v.color))) return false;
      if (selectedBrands.length && !selectedBrands.includes(p.brand)) return false;
      if (p.basePrice > effectivePriceMax) return false;
      return true;
    });

    if (sort === "price_asc") list = [...list].sort((a, b) => a.basePrice - b.basePrice);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.basePrice - a.basePrice);
    else if (sort === "name_asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, selectedSizes, selectedColors, selectedBrands, effectivePriceMax, sort]);

  const toggle = (arr, setArr, value) => setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
  const clearAll = () => { setSelectedSizes([]); setSelectedColors([]); setSelectedBrands([]); setPriceMax(null); };
  const activeFilterCount = selectedSizes.length + selectedColors.length + selectedBrands.length + (priceMax !== null ? 1 : 0);

  const FiltersPanel = (
    <div>
      {allBrands.length > 0 && (
        <FilterSection title="Marca">
          {allBrands.map((b) => (
            <label key={b} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, padding: "6px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggle(selectedBrands, setSelectedBrands, b)} style={{ accentColor: T.accent }} />
              {b}
            </label>
          ))}
        </FilterSection>
      )}

      {allSizes.length > 0 && (
        <FilterSection title="Tamanho">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allSizes.map((s) => {
              const active = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(selectedSizes, setSelectedSizes, s)}
                  style={{
                    padding: "7px 12px", borderRadius: 6, fontSize: 12.5, cursor: "pointer",
                    border: `1px solid ${active ? T.accent : T.border}`,
                    background: active ? "rgba(201,255,63,0.1)" : "none",
                    color: active ? T.accent : T.text,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {allColors.length > 0 && (
        <FilterSection title="Cor">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {allColors.map((c) => {
              const active = selectedColors.includes(c);
              const hex = colorToHex(c);
              return (
                <button
                  key={c}
                  onClick={() => toggle(selectedColors, setSelectedColors, c)}
                  title={c}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: "pointer", padding: 0, width: 44,
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%", background: hex || T.bgRaised2,
                    border: `2px solid ${active ? T.accent : T.border}`, boxSizing: "border-box",
                  }} />
                  <span style={{ fontSize: 10, color: active ? T.accent : T.muted, textAlign: "center", lineHeight: 1.2 }}>{c}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Preço">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.muted, marginBottom: 8 }}>
          <span>€0</span>
          <span>Até €{effectivePriceMax}</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxPricePossible}
          value={effectivePriceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          style={{ width: "100%", accentColor: T.accent }}
        />
      </FilterSection>

      {activeFilterCount > 0 && (
        <button onClick={clearAll} style={{ marginTop: 16, background: "none", border: "none", color: T.muted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
          Limpar filtros ({activeFilterCount})
        </button>
      )}
    </div>
  );

  if (loading) {
    return <Layout><div style={{ color: T.muted, padding: 60, textAlign: "center" }}>A carregar coleção...</div></Layout>;
  }
  if (error || !collection) {
    return <Layout><div style={{ color: T.danger, padding: 60, textAlign: "center" }}>Coleção não encontrada.</div></Layout>;
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 8 }}>Home / {collection.name}</div>
        <h1 style={{ fontFamily: T.fontHeading, fontSize: 34, letterSpacing: 0.5, margin: "0 0 8px" }}>
          {collection.name}
        </h1>
        {collection.description && (
          <p style={{ color: T.muted, fontSize: 14, maxWidth: 560, margin: "0 0 24px" }}>{collection.description}</p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            style={{ display: "none", alignItems: "center", gap: 8, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "9px 14px", fontSize: 13, cursor: "pointer" }}
            className="mobile-filter-btn"
          >
            <SlidersHorizontal size={14} /> Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <span style={{ fontSize: 13, color: T.muted }}>{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "9px 12px", fontSize: 13 }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32, alignItems: "start" }}>
          <aside style={{ position: "sticky", top: 24 }}>{FiltersPanel}</aside>

          <main>
            {filtered.length === 0 ? (
              <div style={{ color: T.muted, padding: 40, textAlign: "center" }}>Sem produtos com estes filtros.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </main>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex" }}>
          <div style={{ background: T.bg, width: "min(320px, 85vw)", height: "100%", padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontFamily: T.fontHeading, fontSize: 20 }}>Filtros</span>
              <button onClick={() => setMobileFiltersOpen(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            {FiltersPanel}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          div[style*="grid-template-columns: 220px 1fr"] { grid-template-columns: 1fr !important; }
          aside[style*="sticky"] { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>
    </Layout>
  );
}
