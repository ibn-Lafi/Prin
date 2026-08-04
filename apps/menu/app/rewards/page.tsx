import { unwrapQuery } from "@brin/database";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { resolveRewards } from "@/lib/resolveRewards";
import type { Branch } from "@/lib/types";
import { RewardsBrowser } from "@/components/RewardsBrowser";

export default async function RewardsPage() {
  const supabase = await getSupabaseServerClient();

  const [rewardsResult, userResult, branchesResult] = await Promise.all([
    supabase
      .from("rewards")
      .select(
        "id, name, description, points_cost, discount_amount, image_url, product_id, combo_id, products ( name, price, image_url ), combos ( name, price, image_url )",
      )
      .order("points_cost"),
    supabase.auth.getUser(),
    supabase
      .from("branches")
      .select("id, name, address, phone, opening_time, closing_time, is_accepting_orders, latitude, longitude")
      .eq("is_active", true)
      .order("display_order"),
  ]);

  const rewards = resolveRewards(unwrapQuery<unknown[]>(rewardsResult as never));
  const branches = unwrapQuery<Branch[]>(branchesResult as never);

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

  return <RewardsBrowser rewards={rewards} pointsBalance={pointsBalance} branches={branches} />;
}
