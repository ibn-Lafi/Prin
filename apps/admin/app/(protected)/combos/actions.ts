"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };
export type CreateResult = { error?: string; id?: string };

const FK_RESTRICT_CODE = "23503";

export type ComboItemInput = { productId: string; quantity: number };

export type ComboInput = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  items: ComboItemInput[];
  pointsPerUnit: number;
};

function validateCombo(input: ComboInput): string | null {
  if (!input.name.trim()) return "اسم الوجبة مطلوب";
  if (!Number.isFinite(input.price) || input.price < 0) return "السعر يجب أن يكون رقماً صحيحاً";
  if (input.items.length === 0) return "أضف صنفاً واحداً على الأقل للوجبة";
  if (input.items.some((item) => !item.productId || item.quantity <= 0)) {
    return "تأكد من اختيار صنف وكمية صحيحة لكل سطر";
  }
  if (!Number.isFinite(input.pointsPerUnit) || input.pointsPerUnit < 0) {
    return "نقاط الولاء يجب أن تكون رقماً صحيحاً";
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
      points_per_unit: input.pointsPerUnit,
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
      points_per_unit: input.pointsPerUnit,
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

export type ModifierGroupInput = {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  displayOrder: number;
};

function validateModifierGroup(input: ModifierGroupInput): string | null {
  if (!input.name.trim()) return "اسم المجموعة مطلوب";
  if (input.maxSelect < input.minSelect) return "الحد الأقصى يجب أن يكون أكبر أو يساوي الحد الأدنى";
  if (input.isRequired && input.minSelect < 1) return "المجموعة الإجبارية تحتاج حد أدنى 1 على الأقل";
  return null;
}

export async function createComboModifierGroupAction(
  comboId: string,
  input: ModifierGroupInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateModifierGroup(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("modifier_groups").insert({
    combo_id: comboId,
    name: input.name.trim(),
    is_required: input.isRequired,
    min_select: input.minSelect,
    max_select: input.maxSelect,
    display_order: input.displayOrder,
  });

  if (error) return { error: "تعذّر إنشاء المجموعة" };

  revalidatePath(`/combos/${comboId}`);
  return {};
}

export async function updateComboModifierGroupAction(
  groupId: string,
  comboId: string,
  input: ModifierGroupInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateModifierGroup(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("modifier_groups")
    .update({
      name: input.name.trim(),
      is_required: input.isRequired,
      min_select: input.minSelect,
      max_select: input.maxSelect,
      display_order: input.displayOrder,
    })
    .eq("id", groupId);

  if (error) return { error: "تعذّر تحديث المجموعة" };

  revalidatePath(`/combos/${comboId}`);
  return {};
}

export async function deleteComboModifierGroupAction(
  groupId: string,
  comboId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("modifier_groups").delete().eq("id", groupId);

  if (error) {
    if (error.code === FK_RESTRICT_CODE) {
      return { error: "لا يمكن حذف هذه المجموعة لأن أحد خياراتها مستخدم بطلبات سابقة" };
    }
    return { error: "تعذّر الحذف" };
  }

  revalidatePath(`/combos/${comboId}`);
  return {};
}

export type ModifierInput = {
  name: string;
  priceDelta: number;
  displayOrder: number;
};

function validateModifier(input: ModifierInput): string | null {
  if (!input.name.trim()) return "اسم الخيار مطلوب";
  if (!Number.isFinite(input.priceDelta)) return "فرق السعر يجب أن يكون رقماً صحيحاً";
  return null;
}

export async function createComboModifierAction(
  groupId: string,
  comboId: string,
  input: ModifierInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateModifier(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("modifiers").insert({
    modifier_group_id: groupId,
    name: input.name.trim(),
    price_delta: input.priceDelta,
    display_order: input.displayOrder,
  });

  if (error) return { error: "تعذّر إنشاء الخيار" };

  revalidatePath(`/combos/${comboId}`);
  return {};
}

export async function updateComboModifierAction(
  modifierId: string,
  comboId: string,
  input: ModifierInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateModifier(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("modifiers")
    .update({
      name: input.name.trim(),
      price_delta: input.priceDelta,
      display_order: input.displayOrder,
    })
    .eq("id", modifierId);

  if (error) return { error: "تعذّر تحديث الخيار" };

  revalidatePath(`/combos/${comboId}`);
  return {};
}

export async function toggleComboModifierAvailabilityAction(
  modifierId: string,
  comboId: string,
  isAvailable: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("modifiers")
    .update({ is_available: isAvailable })
    .eq("id", modifierId);

  if (error) return { error: "تعذّر التحديث" };

  revalidatePath(`/combos/${comboId}`);
  return {};
}

export async function deleteComboModifierAction(
  modifierId: string,
  comboId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("modifiers").delete().eq("id", modifierId);

  if (error) {
    if (error.code === FK_RESTRICT_CODE) {
      return { error: "لا يمكن حذف هذا الخيار لأنه مستخدم بطلبات سابقة — عطّله بدلاً من الحذف" };
    }
    return { error: "تعذّر الحذف" };
  }

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
    description: deleted ? "حذف وجبة من القائمة" : "استرجاع وجبة إلى القائمة",
    metadata: { combo_id: comboId },
  });

  revalidatePath("/combos");
  revalidatePath(`/combos/${comboId}`);
  return {};
}
