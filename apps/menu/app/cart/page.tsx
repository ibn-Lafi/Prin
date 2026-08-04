import { unwrapQuery } from "@brin/database";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { resolveRewards } from "@/lib/resolveRewards";
import type { CartSuggestionLink, Product } from "@/lib/types";
import { CartView } from "@/components/CartView";

const PRODUCT_COLUMNS =
  "id, category_id, name, description, calories, price, image_url, is_available, deleted_at, modifier_groups(id, name, is_required, min_select, max_select, display_order, modifiers(id, name, price_delta, is_available, display_order))";

export default async function CartPage() {
  const supabase = await getSupabaseServerClient();
  const [{ data: settings }, { data: userData }, rewardsResult, linkRowsResult] = await Promise.all([
    supabase.from("restaurant_settings").select("tax_rate_percent").eq("id", 1).single(),
    supabase.auth.getUser(),
    supabase
      .from("rewards")
      .select(
        "id, name, description, points_cost, discount_amount, image_url, product_id, combo_id, products ( name, price, image_url ), combos ( name, price, image_url )",
      )
      .order("points_cost"),
    supabase.from("product_cart_suggestions").select("trigger_product_id, suggested_product_id"),
  ]);

  const linkRows = linkRowsResult.data ?? [];
  const suggestedIds = [...new Set(linkRows.map((row) => row.suggested_product_id))];

  let suggestionLinks: CartSuggestionLink[] = [];
  if (suggestedIds.length > 0) {
    const suggestedProductsResult = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .in("id", suggestedIds)
      .eq("is_available", true)
      .is("deleted_at", null);

    const suggestedProducts = unwrapQuery<Product[]>(suggestedProductsResult as never);
    const productMap = new Map(suggestedProducts.map((p) => [p.id, p]));

    suggestionLinks = linkRows.flatMap((row) => {
      const product = productMap.get(row.suggested_product_id);
      return product ? [{ triggerProductId: row.trigger_product_id, product }] : [];
    });
  }

  // زائر بدون تسجيل دخول يقدر يتصفّح السلة عادي — رصيد النقاط يبقى null وقتها
  // (المكافآت تظهر بالسلة لكن كلها "غير كافٍ" لحد ما يسجّل دخول).
  let pointsBalance: number | null = null;
  const user = userData.user;
  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("points_balance")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    pointsBalance = customer?.points_balance ?? 0;
  }

  // نسبة 15% افتراضية آمنة (ضريبة القيمة المضافة السعودية القياسية) لو تعذّر
  // جلب الإعدادات — لا داعي لتعطيل صفحة السلة كاملة بسبب هذا فقط.
  return (
    <CartView
      taxRatePercent={settings?.tax_rate_percent ?? 15}
      pointsBalance={pointsBalance}
      rewards={resolveRewards(rewardsResult.data)}
      suggestionLinks={suggestionLinks}
    />
  );
}
