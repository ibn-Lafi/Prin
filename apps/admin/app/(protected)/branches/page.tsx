import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { BranchesManager } from "@/components/BranchesManager";

export default async function BranchesPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: branches } = await supabase
    .from("branches")
    .select(
      "id, name, address, phone, opening_time, closing_time, is_accepting_orders, is_active, display_order, latitude, longitude",
    )
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الفروع</h1>
      <BranchesManager branches={branches ?? []} />
    </div>
  );
}
