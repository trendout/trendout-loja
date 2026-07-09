import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useCustomerAddresses(user) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setAddresses([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    setAddresses(
      data.map((a) => ({
        id: a.id,
        label: a.label,
        fullName: a.full_name,
        phone: a.phone,
        address: a.address_line1,
        postalCode: a.postal_code,
        city: a.city,
        country: a.country,
        nif: a.nif,
        isDefaultShipping: a.is_default_shipping,
        isDefaultBilling: a.is_default_billing,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const saveAddress = async (addr) => {
    // se marcada como predefinida, desmarca as outras primeiro
    if (addr.isDefaultShipping) {
      await supabase.from("customer_addresses").update({ is_default_shipping: false }).eq("customer_id", user.id);
    }
    if (addr.isDefaultBilling) {
      await supabase.from("customer_addresses").update({ is_default_billing: false }).eq("customer_id", user.id);
    }

    const payload = {
      id: addr.id,
      customer_id: user.id,
      label: addr.label,
      full_name: addr.fullName,
      phone: addr.phone,
      address_line1: addr.address,
      postal_code: addr.postalCode,
      city: addr.city,
      country: addr.country,
      nif: addr.nif || null,
      is_default_shipping: addr.isDefaultShipping,
      is_default_billing: addr.isDefaultBilling,
    };
    const { error } = await supabase.from("customer_addresses").upsert(payload);
    if (error) throw error;
    await load();
  };

  const deleteAddress = async (id) => {
    await supabase.from("customer_addresses").delete().eq("id", id);
    await load();
  };

  return { addresses, loading, saveAddress, deleteAddress, reload: load };
}
