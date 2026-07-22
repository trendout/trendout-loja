import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams, useLocation } from "react-router-dom";
import { CartProvider } from "./hooks/useCart";
import { FavoritesProvider } from "./hooks/useFavorites";
import { T } from "./lib/theme";
import HomePage from "./pages/HomePage";

// A homepage carrega já com o pacote principal (é a página mais visitada,
// sem intervalo de espera). Todas as outras só carregam o código delas
// quando alguém navega mesmo até lá — reduz bastante o que é preciso
// descarregar na primeira visita.
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const CollectionViewPage = lazy(() => import("./pages/CollectionViewPage"));
const PageViewPage = lazy(() => import("./pages/PageViewPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));

function ProductRoute() {
  const { slug } = useParams();
  return <ProductPage slug={slug} />;
}

function CollectionRoute() {
  const { categoryName } = useParams();
  const decoded = decodeURIComponent(categoryName);
  return <CollectionPage categoryName={decoded} title={decoded} />;
}

function CollectionViewRoute() {
  const { slug } = useParams();
  return <CollectionViewPage slug={slug} />;
}

function PageRoute() {
  const { slug } = useParams();
  return <PageViewPage slug={slug} />;
}

function RouteFallback() {
  return <div style={{ minHeight: "60vh", background: T.bg }} />; // fundo igual ao da loja, sem "flash" branco enquanto carrega
}

// Ao contrário de sites tradicionais, esta loja muda de página sem recarregar
// o browser — por isso o scroll fica onde estava, mesmo ao abrires um produto
// novo. Isto repõe sempre o topo quando o URL muda.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categoria/:categoryName" element={<CollectionRoute />} />
              <Route path="/coleccao/:slug" element={<CollectionViewRoute />} />
              <Route path="/pagina/:slug" element={<PageRoute />} />
              <Route path="/produto/:slug" element={<ProductRoute />} />
              <Route path="/carrinho" element={<CheckoutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/conta" element={<AccountPage />} />
              <Route path="/checkout/sucesso" element={<OrderConfirmationPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </FavoritesProvider>
    </CartProvider>
  );
}
