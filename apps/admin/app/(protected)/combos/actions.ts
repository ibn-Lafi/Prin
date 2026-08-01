"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };
export type CreateResult = { error?: string; id?: string };

export type ComboItemInput = { productId: string; quantity: number };

export type ComboInput = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  items: ComboItemInput[];
};

function validateCombo(input: ComboInput): string | null {
  if (!input.name.trim()) return "اسم الوجبة مطلوب";
  if (!Number.isFinite(input.price) || input.price < 0) return "السعر يجب أن يكون رقماً صحيحاً";
  if (input.items.length === 0) return "أضف صنفاً واحداً على الأقل للوجبة";
  if (input.items.some((item) => !item.productId || item.quantity <= 0)) {
    return "تأكد من اختيار صنف وكمية صحيحة لكل سطر";
  }
  return null;
}

export async function createComboAction(input: ComboInput): Promise<CreateResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateCombo(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("combos")
    .insert({
      name: input.name.trim(),
      description: input.description.trim() || null,
      price: input.price,
      image_url: input.imageUrl.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "تعذّر إنشاء الوجبة" };

  const { error: itemsError } = await supabase.from("combo_items").insert(
    input.items.map((item) => ({
      combo_id: data.id,
      product_id: item.productId,
      quantity: item.quantity,
    })),
  );

  if (itemsError) return { error: "تعذّر حفظ أصناف الوجبة" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة وجبة جديدة: ${input.name.trim()}`,
  });

  revalidatePath("/combos");
  return { id: data.id };
}

export async function updateComboAction(comboId: string, input: ComboInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateCombo(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("combos")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      price: input.price,
      image_url: input.imageUrl.trim() || null,
    })
    .eq("id", comboId);

  if (error) return { error: "تعذّر تحديث الوجبة" };

  await supabase.from("combo_items").delete().eq("combo_id", comboId);
  const { error: itemsError } = await supabase.from("combo_items").insert(
    input.items.map((item) => ({
      combo_id: comboId,
      product_id: item.productId,
      quantity: item.quantity,
    })),
  );

  if (itemsError) return { error: "تعذّر حفظ أصناف الوجبة" };

  revalidatePath("/combos");
  revalidatePath(`/combos/${comboId}`);
  return {};
}

export async function toggleComboAvailabilityAction(
  comboId: string,
  isAvailable: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("combos").update({ is_available: isAvailable }).eq("id", comboId);
  if (error) return { error: "تعذّر التحديث" };

  revalidatePath("/combos");
  revalidatePath(`/combos/${comboId}`);
  return {};
}

export async function setComboDeletedAction(comboId: string, deleted: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("combos")
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq("id", comboId);

  if (error) return { error: "تعذّر التحديث" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: deleted ? "حذف وجبة من المنيو" : "استرجاع وجبة للمنيو",
    metadata: { combo_id: comboId },
  });

  revalidatePath("/combos");
  revalidatePath(`/combos/${comboId}`);
  return {};
}
