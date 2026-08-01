import { notFound } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { ComboForm } from "@/components/ComboForm";
import { ComboStatusActions } from "@/components/ComboStatusActions";
import type { Combo, ComboItem } from "@/lib/types";

type ComboRow = Combo & { combo_items: ComboItem[] };

export default async function ComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const [{ data: products }, { data: rawCombo }] = await Promise.all([
    supabase.from("products").select("id, name").is("deleted_at", null).order("name", { ascending: true }),
    supabase
      .from("combos")
      .select(
        `id, name, description, price, image_url, is_available, deleted_at,
         combo_items ( id, product_id, quantity )`,
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
    </div>
  );
}
