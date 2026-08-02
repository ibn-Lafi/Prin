import { notFound } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { ProductForm } from "@/components/ProductForm";
import { ProductStatusActions } from "@/components/ProductStatusActions";
import { ModifierGroupsManager } from "@/components/ModifierGroupsManager";
import type { ModifierGroup, Product } from "@/lib/types";

type ProductRow = Product & { modifier_groups: ModifierGroup[] };

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const [{ data: categories }, { data: rawProduct }] = await Promise.all([
    supabase.from("categories").select("id, name").order("display_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        `id, category_id, name, description, calories, price, image_url, is_available, deleted_at, points_per_unit,
         modifier_groups ( id, name, is_required, min_select, max_select, display_order,
           modifiers ( id, name, price_delta, is_available, display_order ) )`,
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  const product = rawProduct as unknown as ProductRow | null;
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{product.name}</h1>

      <div className="flex flex-wrap gap-6">
        <ProductForm categories={categories ?? []} product={product} />
        <ProductStatusActions
          productId={product.id}
          isAvailable={product.is_available}
          isDeleted={product.deleted_at !== null}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">التعديلات (Modifiers)</h2>
        <ModifierGroupsManager
          productId={product.id}
          groups={(product.modifier_groups ?? []).sort((a, b) => a.display_order - b.display_order)}
        />
      </div>
    </div>
  );
}
