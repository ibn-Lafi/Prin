import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { ComboForm } from "@/components/ComboForm";

export default async function NewComboPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">إضافة وجبة</h1>
      <ComboForm products={products ?? []} />
    </div>
  );
}
