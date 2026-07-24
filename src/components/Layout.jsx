import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon, X, ShoppingBag, Search, User, ChevronDown } from "lucide-react";
import { T } from "../lib/theme";
import { usePublicMenus } from "../hooks/usePublicMenus";
import { useStoreInfo } from "../hooks/useStoreInfo";
import { useCart } from "../hooks/useCart";
import { useInjectAnalytics } from "../hooks/useInjectAnalytics";
import { useGoogleIntegrations } from "../hooks/useGoogleIntegrations";
import { useMetaPixel } from "../hooks/useMetaPixel";
import { applyTheme } from "../lib/colorUtils";
const PromoPopup = React.lazy(() => import("./PromoPopup"));
import { useTrackPageView } from "../hooks/useTrackPageView";
import { useVisitorHeartbeat } from "../hooks/useVisitorHeartbeat";
import { useCartSync } from "../hooks/useCartSync";
import { useCookieConsent } from "../hooks/useCookieConsent";
import CookieBanner from "./CookieBanner";
import { usePublicCategories } from "../hooks/usePublicCategories";
import { useCategoryProducts } from "../hooks/useCategoryProducts";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

function navHref(item) {
  if (item.linkType === "category") return `/categoria/${encodeURIComponent(item.value)}`;
  if (item.linkType === "collection") return `/coleccao/${encodeURIComponent(item.value)}`;
  return `/${item.value}`.replace("//", "/");
}

function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const runSearch = async (q) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, base_price, images")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .limit(6);
    setResults(data || []);
    setSearching(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", color: T.text, cursor: "pointer", display: "flex", alignItems: "center" }}
        aria-label="Pesquisar"
      >
        <Search size={18} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setOpen(false)} />
          <div className="search-dropdown" style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: 320, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, zIndex: 61, boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Pesquisar produtos..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13.5, boxSizing: "border-box" }}
            />
            {searching && <div style={{ color: T.muted, fontSize: 12.5, padding: "10px 4px" }}>A procurar...</div>}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <div style={{ color: T.muted, fontSize: 12.5, padding: "10px 4px" }}>Sem resultados para "{query}".</div>
            )}
            {results.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
                {results.map((p) => (
                  <Link
                    key={p.id}
                    to={`/produto/${p.slug}`}
                    onClick={() => setOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 8, textDecoration: "none", color: T.text }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", background: T.bgRaised2, flexShrink: 0 }}>
                      {p.images?.[0] && <img src={p.images[0]} alt={p.name} loading="lazy" width={40} height={40} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: T.accent }}>€{Number(p.base_price).toFixed(2)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NavDropdown({ categoryName }) {
  const { subcategoriesOf } = usePublicCategories();
  const { products, loading } = useCategoryProducts(categoryName, 3);
  const subcategories = subcategoriesOf(categoryName);

  if (loading || (subcategories.length === 0 && products.length === 0)) return null;

  return (
    <div style={{ position: "absolute", top: "100%", left: 0, paddingTop: 12, zIndex: 61 }}>
      <div
        style={{
          background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10,
          padding: 20, boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
          display: "flex", gap: 32, minWidth: 420,
        }}
      >
        {subcategories.length > 0 && (
          <div style={{ minWidth: 140 }}>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Subcategorias</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subcategories.map((s) => (
                <Link key={s.id} to={`/categoria/${encodeURIComponent(s.name)}`} className="hover-accent" style={{ color: T.text, fontSize: 13, textDecoration: "none" }}>
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Em destaque</div>
            <div style={{ display: "flex", gap: 14 }}>
              {products.map((p) => (
                <Link key={p.id} to={`/produto/${p.slug}`} className="hover-accent" style={{ textDecoration: "none", color: T.text, width: 92 }}>
                  <div style={{ width: 92, height: 92, borderRadius: 8, overflow: "hidden", background: T.bgRaised2, marginBottom: 6 }}>
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} loading="lazy" width={92} height={92} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: T.accent, fontWeight: 700 }}>€{p.basePrice.toFixed(2)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SiteHeader({ mainNav, onOpenMenu }) {
  const { totalQty } = useCart();
  const [hoveredItem, setHoveredItem] = useState(null);
  return (
    <header style={{ borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.bg, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onOpenMenu} className="hamburger-btn" aria-label="Abrir menu" style={{ display: "none", background: "none", border: "none", color: T.text, cursor: "pointer" }}>
          <MenuIcon size={22} />
        </button>

        <Link to="/" style={{ display: "flex" }}>
          <img src={logo} alt="Trendout" width={188} height={52} style={{ height: 52, width: "auto" }} />
        </Link>

        <nav className="desktop-nav" style={{ display: "flex", gap: 28 }}>
          {mainNav.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredItem(idx)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                to={navHref(item)}
                className="hover-accent"
                style={{ color: T.text, textDecoration: "none", fontSize: 13.5, fontWeight: 500 }}
              >
                {item.label}
              </Link>
              {item.linkType === "category" && hoveredItem === idx && (
                <NavDropdown categoryName={item.value} />
              )}
            </div>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 18, fontSize: 13.5, alignItems: "center" }}>
          <SearchBox />
          <Link to="/conta" className="hover-accent" style={{ color: T.text, textDecoration: "none", display: "flex", alignItems: "center" }} aria-label="A minha conta">
            <User size={18} />
          </Link>
          <Link to="/carrinho" className="hover-accent" aria-label="Carrinho" style={{ color: T.text, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            <ShoppingBag size={17} />
            <span className="cart-label">Carrinho</span>
            {totalQty > 0 && (
              <span style={{ position: "absolute", top: -8, right: -10, background: T.accent, color: T.bg, fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {totalQty}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function MobileNavItem({ item, onClose }) {
  const { subcategoriesOf } = usePublicCategories();
  const [expanded, setExpanded] = useState(false);
  const subcategories = item.linkType === "category" ? subcategoriesOf(item.value) : [];
  const hasSubcategories = subcategories.length > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          to={navHref(item)}
          onClick={onClose}
          className="hover-accent"
          style={{ color: T.text, textDecoration: "none", fontSize: 16, fontWeight: 600, flex: 1 }}
        >
          {item.label}
        </Link>
        {hasSubcategories && (
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-label="Mostrar subcategorias"
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 6, display: "flex" }}
          >
            <ChevronDown size={18} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>
        )}
      </div>
      {hasSubcategories && expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, paddingLeft: 14, borderLeft: `2px solid ${T.border}` }}>
          {subcategories.map((s) => (
            <Link
              key={s.id}
              to={`/categoria/${encodeURIComponent(s.name)}`}
              onClick={onClose}
              className="hover-accent"
              style={{ color: T.muted, textDecoration: "none", fontSize: 14.5 }}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileDrawer({ mainNav, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex" }}>
      <div style={{ background: T.bg, width: "min(300px, 85vw)", height: "100%", padding: 24, borderRight: `1px solid ${T.border}`, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <img src={logo} alt="Trendout" width={159} height={44} style={{ height: 44, width: "auto" }} />
          <button onClick={onClose} aria-label="Fechar menu" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={22} /></button>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {mainNav.map((item, idx) => (
            <MobileNavItem key={`${item.label}-${idx}`} item={item} onClose={onClose} />
          ))}
        </nav>
      </div>
      <div style={{ flex: 1 }} onClick={onClose} />
    </div>
  );
}

const PAYMENT_LABELS = { visa: "VISA", mastercard: "Mastercard", amex: "AMEX", transfer: "Transferência" };

function PaymentIcons({ accepted }) {
  const methods = (accepted && accepted.length ? accepted : ["visa", "mastercard", "amex", "transfer"]);
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
      {methods.map((m) => (
        <span key={m} style={{ fontSize: 11, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 9px" }}>
          {PAYMENT_LABELS[m] || m}
        </span>
      ))}
    </div>
  );
}

function SiteFooter({ footerLoja, footerAjuda, footerLegal, info }) {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, marginTop: 20 }}>
      <div className="footer-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 24px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <img src={logo} alt="Trendout" width={174} height={48} style={{ height: 48, width: "auto" }} />
          </div>
          {info.showCompanyInfoFooter !== false && (
            <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
              {info.companyAddress}<br />
              {info.companyPhone} · {info.companyEmail}
              {info.companyNif && <><br />NIF: {info.companyNif}</>}
            </div>
          )}
          <PaymentIcons accepted={info.paymentMethodsAccepted} />
        </div>
        {[
          { title: "Loja", items: footerLoja },
          { title: "Ajuda", items: footerAjuda },
          { title: "Legal", items: footerLegal },
        ].map((col) => (
          <div key={col.title}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14, color: T.muted }}>{col.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.items.map((item, idx) => (
                <Link
                  key={`${item.label}-${idx}`}
                  to={navHref(item)}
                  className="hover-accent"
                  style={{ color: T.text, fontSize: 13, textDecoration: "none" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 24px", textAlign: "center", fontSize: 11.5, color: T.muted }}>
        © {new Date().getFullYear()} Trendout. Todos os direitos reservados.
        {" · "}
        <CookieSettingsLink />
      </div>
    </footer>
  );
}

function CookieSettingsLink() {
  const { openSettings } = useCookieConsent();
  return (
    <button onClick={openSettings} style={{ background: "none", border: "none", color: T.muted, textDecoration: "underline", cursor: "pointer", fontSize: 11.5, padding: 0 }}>
      Definições de cookies
    </button>
  );
}

function AnnouncementBanner({ message }) {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("trendout_announcement_dismissed") === message);

  if (!message || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem("trendout_announcement_dismissed", message);
    setDismissed(true);
  };

  return (
    <div style={{ background: T.accent, color: T.bg, padding: "10px 24px", textAlign: "center", fontSize: 13, fontWeight: 600, position: "relative" }}>
      <span style={{ paddingRight: 28 }}>{message}</span>
      <button
        onClick={dismiss}
        aria-label="Fechar aviso"
        style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.bg, cursor: "pointer", display: "flex", padding: 4 }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

function MaintenanceOverlay({ message }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px 32px", maxWidth: 440, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🛠️</div>
        <h1 style={{ fontFamily: T.fontHeading, fontSize: 24, margin: "0 0 12px", color: T.text }}>Loja em manutenção</h1>
        <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
          {message || "Estamos a atualizar a loja. Volta a visitar-nos em breve!"}
        </p>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { menus, loading: menusLoading } = usePublicMenus();
  const { info, loading: infoLoading } = useStoreInfo();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { consent } = useCookieConsent();

  useInjectAnalytics((consent?.analytics || consent?.marketing) ? info.analyticsScripts : null);
  useGoogleIntegrations(info, consent?.marketing);
  useMetaPixel(info.metaPixelId, consent?.marketing);
  useTrackPageView(consent?.analytics);
  useVisitorHeartbeat(consent?.analytics);
  useCartSync();

  useEffect(() => {
    if (info.theme) applyTheme(info.theme);
  }, [info.theme]);

  const mainNav = menus.main_nav || [];
  const loading = menusLoading || infoLoading;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.fontBody }}>
      {info.announcementEnabled && info.announcementMessage && (
        <AnnouncementBanner message={info.announcementMessage} />
      )}

      <SiteHeader mainNav={mainNav} onOpenMenu={() => setDrawerOpen(true)} />
      {drawerOpen && <MobileDrawer mainNav={mainNav} onClose={() => setDrawerOpen(false)} />}

      {children}

      {!loading && (
        <SiteFooter
          footerLoja={menus.footer_loja || []}
          footerAjuda={menus.footer_ajuda || []}
          footerLegal={menus.footer_legal || []}
          info={info}
        />
      )}

      {!loading && info.maintenanceModeEnabled && (
        <MaintenanceOverlay message={info.maintenanceMessage} />
      )}

      {!loading && !info.maintenanceModeEnabled && info.promoPopupEnabled && info.promoPopupMessage && info.promoPopupCouponCode && (
        <React.Suspense fallback={null}>
          <PromoPopup message={info.promoPopupMessage} couponCode={info.promoPopupCouponCode} />
        </React.Suspense>
      )}

      <CookieBanner />

      <style>{`
        .hover-accent { transition: color .15s; }
        .hover-accent:hover { color: ${T.accent} !important; }
        @media (max-width: 780px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .cart-label { display: none; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .search-dropdown {
            position: fixed !important;
            left: 50% !important;
            right: auto !important;
            top: 70px !important;
            transform: translateX(-50%) !important;
            width: calc(100vw - 32px) !important;
          }
        }
      `}</style>
    </div>
  );
}
