import { supabase } from "./supabase";

export async function validateCoupon(code) {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return { code: data.code, type: data.type, value: Number(data.value), label: data.label };
}

export function computeDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === "percent") return +(subtotal * (coupon.value / 100)).toFixed(2);
  return Math.min(coupon.value, subtotal);
}
