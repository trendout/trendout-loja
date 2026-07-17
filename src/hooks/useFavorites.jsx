import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useCustomerAuth } from "./useCustomerAuth";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useCustomerAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) { setFavoriteIds(new Set()); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase.from("favorites").select("product_id").eq("customer_id", user.id);
      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; }
      setFavoriteIds(new Set(data.map((f) => f.product_id)));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const isFavorite = (productId) => favoriteIds.has(productId);

  const toggleFavorite = async (productId) => {
    if (!user) return false; // só clientes com sessão iniciada podem ter favoritos

    if (favoriteIds.has(productId)) {
      await supabase.from("favorites").delete().eq("customer_id", user.id).eq("product_id", productId);
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
    } else {
      await supabase.from("favorites").insert({ customer_id: user.id, product_id: productId });
      setFavoriteIds((prev) => new Set(prev).add(productId));
    }
    return true;
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loading, loggedIn: !!user }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites tem de ser usado dentro de <FavoritesProvider>");
  return ctx;
}
