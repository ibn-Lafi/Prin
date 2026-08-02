import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { RewardsManager } from "@/components/RewardsManager";
import type { RewardLinkOption } from "@/lib/types";

export default async function RewardsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const [{ data: rewards }, { data: products }, { data: combos }] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, name, description, points_cost, discount_amount, image_url, is_active, product_id, combo_id")
      .order("points_cost", { ascending: true }),
    supabase.from("products").select("id, name, price, image_url").is("deleted_at", null).order("name"),
    supabase.from("combos").select("id, name, price, image_url").is("deleted_at", null).order("name"),
  ]);

  const linkOptions: RewardLinkOption[] = [
    ...(products ?? []).map((p) => ({ kind: "product" as const, id: p.id, name: p.name, price: p.price, imageUrl: p.image_url })),
    ...(combos ?? []).map((c) => ({ kind: "combo" as const, id: c.id, name: c.name, price: c.price, imageUrl: c.image_url })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الولاء والمكافآت</h1>
      <RewardsManager rewards={rewards ?? []} linkOptions={linkOptions} />
    </div>
  );
}
