import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const MENU_KEYS = ["main_nav", "footer_loja", "footer_ajuda", "footer_legal"];

export function usePublicMenus() {
  const [menus, setMenus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: allMenus } = await supabase.from("menus").select("*").in("key", MENU_KEYS);
      const { data: items } = await supabase
        .from("menu_items")
        .select("*, collections(slug, name)")
        .eq("is_active", true)
        .order("position");

      if (cancelled || !allMenus || !items) { setLoading(false); return; }

      const grouped = {};
      MENU_KEYS.forEach((k) => { grouped[k] = []; });
      items.forEach((it) => {
        const menuKey = allMenus.find((m) => m.id === it.menu_id)?.key;
        if (!menuKey) return;
        grouped[menuKey].push({
          label: it.label,
          linkType: it.link_type,
          value: it.link_type === "category" ? it.category : it.link_type === "collection" ? it.collections?.slug : it.custom_url,
        });
      });
      setMenus(grouped);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { menus, loading };
}
