import { redirect } from "next/navigation";
import { unwrapQuery } from "@brin/database";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import type { OrderSummary, Reward } from "@/lib/types";
import { AccountView } from "@/components/AccountView";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("full_name, phone, points_balance")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const [ordersResult, rewardsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, daily_order_number, order_date, channel, status, total, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("rewards")
      .select("id, name, description, points_cost, image_url")
      .order("points_cost"),
  ]);

  const orders = unwrapQuery<OrderSummary[]>(ordersResult as never);
  const rewards = unwrapQuery<Reward[]>(rewardsResult);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <AccountView
      phone={customer?.phone ?? user.phone ?? ""}
      pointsBalance={customer?.points_balance ?? 0}
      totalSpent={totalSpent}
      orders={orders}
      rewards={rewards}
    />
  );
}
