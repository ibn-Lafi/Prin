import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { resolveRewards } from "@/lib/resolveRewards";
import { CartView } from "@/components/CartView";

export default async function CartPage() {
  const supabase = await getSupabaseServerClient();
  const [{ data: settings }, { data: userData }, rewardsResult] = await Promise.all([
    supabase.from("restaurant_settings").select("tax_rate_percent").eq("id", 1).single(),
    supabase.auth.getUser(),
    supabase
      .from("rewards")
      .select(
        "id, name, description, points_cost, discount_amount, image_url, product_id, combo_id, products ( name, price, image_url ), combos ( name, price, image_url )",
      )
      .order("points_cost"),
  ]);

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
    />
  );
}
