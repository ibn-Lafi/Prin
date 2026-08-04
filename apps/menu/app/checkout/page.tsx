import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { resolveRewards } from "@/lib/resolveRewards";
import { CheckoutView } from "@/components/CheckoutView";

export default async function CheckoutPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/checkout");
  }

  const [{ data: settings }, { data: branches }, { data: customer }, rewardsResult] = await Promise.all([
    supabase.from("restaurant_settings").select("tax_rate_percent").eq("id", 1).single(),
    supabase
      .from("branches")
      .select("id, name, address, phone, opening_time, closing_time, is_accepting_orders")
      .eq("is_active", true)
      .order("display_order"),
    supabase.from("customers").select("points_balance").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("rewards")
      .select(
        "id, name, description, points_cost, discount_amount, image_url, product_id, combo_id, products ( name, price, image_url ), combos ( name, price, image_url )",
      )
      .order("points_cost"),
  ]);

  return (
    <CheckoutView
      customerPhone={user.phone ?? ""}
      taxRatePercent={settings?.tax_rate_percent ?? 15}
      branches={branches ?? []}
      pointsBalance={customer?.points_balance ?? 0}
      rewards={resolveRewards(rewardsResult.data)}
    />
  );
}
