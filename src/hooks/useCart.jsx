import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "trendout_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // key única por variante (produto + tamanho + cor)
  const keyOf = (productId, size, color) => `${productId}::${size}::${color}`;

  const addItem = (product, variant, qty = 1) => {
    const key = keyOf(product.id, variant.size, variant.color);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, variant.stock) } : i));
      }
      return [...prev, {
        key,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        image: product.images?.[0] || null,
        size: variant.size,
        color: variant.color,
        price: product.basePrice,
        stock: variant.stock,
        qty: Math.min(qty, variant.stock),
      }];
    });
  };

  const updateQty = (key, qty) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i)));
  };

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, subtotal, totalQty }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart tem de ser usado dentro de <CartProvider>");
  return ctx;
}
