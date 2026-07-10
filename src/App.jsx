import React from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { CartProvider } from "./hooks/useCart";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import CollectionViewPage from "./pages/CollectionViewPage";
import PageViewPage from "./pages/PageViewPage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";

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

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
      </BrowserRouter>
    </CartProvider>
  );
}
