import { unwrapQuery } from "@brin/database";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import type { Branch, Category, Combo, Product } from "@/lib/types";
import { MenuBrowser } from "@/components/MenuBrowser";

export default async function MenuHomePage() {
  const supabase = await getSupabaseServerClient();

  const [categoriesResult, productsResult, combosResult, branchesResult] = await Promise.all([
    supabase.from("categories").select("id, name, display_order").order("display_order"),
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, calories, price, image_url, is_available, deleted_at, modifier_groups(id, name, is_required, min_select, max_select, display_order, modifiers(id, name, price_delta, is_available, display_order))",
      )
      .order("name"),
    supabase
      .from("combos")
      .select(
        "id, name, description, price, image_url, is_available, deleted_at, modifier_groups(id, name, is_required, min_select, max_select, display_order, modifiers(id, name, price_delta, is_available, display_order))",
      )
      .order("name"),
    supabase
      .from("branches")
      .select("id, name, address, phone, opening_time, closing_time, is_accepting_orders, latitude, longitude")
      .eq("is_active", true)
      .order("display_order"),
  ]);

  const categories = unwrapQuery<Category[]>(categoriesResult);
  const products = unwrapQuery<Product[]>(productsResult as never);
  const combos = unwrapQuery<Combo[]>(combosResult as never);
  const branches = unwrapQuery<Branch[]>(branchesResult as never);

  return <MenuBrowser categories={categories} products={products} combos={combos} branches={branches} />;
}
