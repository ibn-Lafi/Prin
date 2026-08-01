import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { ProductForm } from "@/components/ProductForm";

export default async function NewProductPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">إضافة صنف</h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
