import { notFound } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { ComboForm } from "@/components/ComboForm";
import { ComboStatusActions } from "@/components/ComboStatusActions";
import { ComboModifierGroupsManager } from "@/components/ComboModifierGroupsManager";
import type { Combo, ComboItem, ModifierGroup } from "@/lib/types";

type ComboRow = Combo & { combo_items: ComboItem[]; modifier_groups: ModifierGroup[] };

export default async function ComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const [{ data: products }, { data: rawCombo }] = await Promise.all([
    supabase.from("products").select("id, name").is("deleted_at", null).order("name", { ascending: true }),
    supabase
      .from("combos")
      .select(
        `id, name, description, price, image_url, is_available, deleted_at,
         combo_items ( id, product_id, quantity ),
         modifier_groups ( id, name, is_required, min_select, max_select, display_order,
           modifiers ( id, name, price_delta, is_available, display_order ) )`,
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  const combo = rawCombo as unknown as ComboRow | null;
  if (!combo) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{combo.name}</h1>

      <div className="flex flex-wrap gap-6">
        <ComboForm products={products ?? []} combo={combo} />
        <ComboStatusActions
          comboId={combo.id}
          isAvailable={combo.is_available}
          isDeleted={combo.deleted_at !== null}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">التعديلات (Modifiers)</h2>
        <ComboModifierGroupsManager
          comboId={combo.id}
          groups={(combo.modifier_groups ?? []).sort((a, b) => a.display_order - b.display_order)}
        />
      </div>
    </div>
  );
}
