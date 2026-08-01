import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { CategoriesManager } from "@/components/CategoriesManager";

export default async function CategoriesPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, display_order, is_active")
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">فئات المنيو</h1>
      <CategoriesManager categories={categories ?? []} />
    </div>
  );
}
