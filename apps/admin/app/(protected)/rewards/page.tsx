import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { RewardsManager } from "@/components/RewardsManager";

export default async function RewardsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, name, description, points_cost, discount_amount, is_active")
    .order("points_cost", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الولاء والمكافآت</h1>
      <RewardsManager rewards={rewards ?? []} />
    </div>
  );
}
