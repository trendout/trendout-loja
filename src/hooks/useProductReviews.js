import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useProductReviews(productId, user) {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (!error) {
      setReviews(data.map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        rating: r.rating,
        comment: r.comment || "",
        createdAt: r.created_at,
      })));
    }

    if (user) {
      const { data: mine } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("customer_id", user.id)
        .maybeSingle();
      setMyReview(mine ? { rating: mine.rating, comment: mine.comment || "", status: mine.status } : null);
    } else {
      setMyReview(null);
    }

    setLoading(false);
  }, [productId, user]);

  useEffect(() => { load(); }, [load]);

  const submitReview = async (rating, comment) => {
    if (!user) throw new Error("Precisas de sessão iniciada para avaliar.");
    const customerName = user.user_metadata?.full_name || user.email.split("@")[0];

    const { error } = await supabase.from("product_reviews").upsert(
      { product_id: productId, customer_id: user.id, customer_name: customerName, rating, comment, status: "pending" },
      { onConflict: "product_id,customer_id" }
    );
    if (error) throw error;
    await load();
  };

  const average = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return { reviews, myReview, average, count: reviews.length, loading, submitReview };
}
