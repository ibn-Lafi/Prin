import { unwrapQuery } from "@brin/database";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import type { Category, Combo, Product, Reward } from "@/lib/types";
import { MenuBrowser } from "@/components/MenuBrowser";

export default async function MenuHomePage() {
  const supabase = await getSupabaseServerClient();

  const [categoriesResult, productsResult, combosResult, rewardsResult, userResult] =
    await Promise.all([
      supabase.from("categories").select("id, name, display_order").order("display_order"),
      supabase
        .from("products")
        .select(
          "id, category_id, name, description, calories, price, image_url, is_available, deleted_at, modifier_groups(id, name, is_required, min_select, max_select, display_order, modifiers(id, name, price_delta, is_available, display_order))",
        )
        .order("name"),
      supabase
        .from("combos")
        .select("id, name, description, price, image_url, is_available, deleted_at")
        .order("name"),
      supabase
        .from("rewards")
        .select("id, name, description, points_cost, image_url")
        .order("points_cost"),
      supabase.auth.getUser(),
    ]);

  const categories = unwrapQuery<Category[]>(categoriesResult);
  const products = unwrapQuery<Product[]>(productsResult as never);
  const combos = unwrapQuery<Combo[]>(combosResult);
  const rewards = unwrapQuery<Reward[]>(rewardsResult);

  let pointsBalance: number | null = null;
  const user = userResult.data.user;
  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("points_balance")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    pointsBalance = customer?.points_balance ?? 0;
  }

  return (
    <MenuBrowser
      categories={categories}
      products={products}
      combos={combos}
      rewards={rewards}
      pointsBalance={pointsBalance}
    />
  );
}
