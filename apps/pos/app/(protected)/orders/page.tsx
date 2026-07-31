import { unwrapQuery } from "@brin/database";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import type { Category, Combo, Product } from "@/lib/types";
import { POSOrderBuilder } from "@/components/POSOrderBuilder";

export default async function OrdersPage() {
  const supabase = createSupabaseServiceRoleClient();

  const [categoriesResult, productsResult, combosResult, settingsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, display_order")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, price, image_url, is_available, deleted_at, modifier_groups(id, name, is_required, min_select, max_select, display_order, modifiers(id, name, price_delta, is_available, display_order))",
      )
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("combos")
      .select("id, name, description, price, image_url, is_available, deleted_at")
      .is("deleted_at", null)
      .order("name"),
    supabase.from("restaurant_settings").select("tax_rate_percent").eq("id", 1).single(),
  ]);

  const categories = unwrapQuery<Category[]>(categoriesResult);
  const products = unwrapQuery<Product[]>(productsResult as never);
  const combos = unwrapQuery<Combo[]>(combosResult);

  return (
    <POSOrderBuilder
      categories={categories}
      products={products}
      combos={combos}
      taxRatePercent={settingsResult.data?.tax_rate_percent ?? 15}
    />
  );
}
