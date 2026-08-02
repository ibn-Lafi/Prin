"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };
export type CreateResult = { error?: string; id?: string };

const FK_RESTRICT_CODE = "23503";

export type ProductInput = {
  categoryId: string;
  name: string;
  description: string;
  calories: number | null;
  price: number;
  imageUrl: string;
};

function validateProduct(input: ProductInput): string | null {
  if (!input.categoryId) return "اختر فئة";
  if (!input.name.trim()) return "اسم الصنف مطلوب";
  if (!Number.isFinite(input.price) || input.price < 0) return "السعر يجب أن يكون رقماً صحيحاً";
  if (input.calories !== null && (!Number.isFinite(input.calories) || input.calories < 0)) {
    return "السعرات الحرارية يجب أن تكون رقماً صحيحاً";
  }
  return null;
}

export async function createProductAction(input: ProductInput): Promise<CreateResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateProduct(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      category_id: input.categoryId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      calories: input.calories,
      price: input.price,
      image_url: input.imageUrl.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "تعذّر إنشاء الصنف" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة صنف جديد: ${input.name.trim()}`,
  });

  revalidatePath("/products");
  return { id: data.id };
}

export async function updateProductAction(productId: string, input: ProductInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateProduct(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      calories: input.calories,
      price: input.price,
      image_url: input.imageUrl.trim() || null,
    })
    .eq("id", productId);

  if (error) return { error: "تعذّر تحديث الصنف" };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return {};
}

export async function toggleProductAvailabilityAction(
  productId: string,
  isAvailable: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", productId);

  if (error) return { error: "تعذّر التحديث" };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return {};
}

export async function setProductDeletedAction(
  productId: string,
  deleted: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq("id", productId);

  if (error) return { error: "تعذّر التحديث" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: deleted ? "حذف صنف من المنيو" : "استرجاع صنف للمنيو",
    metadata: { product_id: productId },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return {};
}

/** حذف نهائي للصنف من قاعدة البيانات — يفشل بقيد FK لو الصنف مستخدم بطلبات
 * سابقة أو ضمن وجبة، وحينها الحل هو "حذف الصنف من المنيو" (deleted_at) بدلاً من هذا. */
export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", productId)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    if (error.code === FK_RESTRICT_CODE) {
      return {
        error: "لا يمكن حذف هذا الصنف نهائياً لأنه مستخدم بطلبات سابقة أو ضمن وجبة — استخدم \"حذف الصنف من المنيو\" بدلاً من ذلك",
      };
    }
    return { error: "تعذّر الحذف" };
  }

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `حذف نهائي للصنف: ${product?.name ?? productId}`,
  });

  revalidatePath("/products");
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

export async function createModifierGroupAction(
  productId: string,
  input: ModifierGroupInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateModifierGroup(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("modifier_groups").insert({
    product_id: productId,
    name: input.name.trim(),
    is_required: input.isRequired,
    min_select: input.minSelect,
    max_select: input.maxSelect,
    display_order: input.displayOrder,
  });

  if (error) return { error: "تعذّر إنشاء المجموعة" };

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function updateModifierGroupAction(
  groupId: string,
  productId: string,
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

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function deleteModifierGroupAction(
  groupId: string,
  productId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("modifier_groups").delete().eq("id", groupId);

  if (error) {
    if (error.code === FK_RESTRICT_CODE) {
      return { error: "لا يمكن حذف هذي المجموعة لأن أحد خياراتها مستخدم بطلبات سابقة" };
    }
    return { error: "تعذّر الحذف" };
  }

  revalidatePath(`/products/${productId}`);
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

export async function createModifierAction(
  groupId: string,
  productId: string,
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

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function updateModifierAction(
  modifierId: string,
  productId: string,
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

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function toggleModifierAvailabilityAction(
  modifierId: string,
  productId: string,
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

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function deleteModifierAction(modifierId: string, productId: string): Promise<ActionResult> {
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

  revalidatePath(`/products/${productId}`);
  return {};
}
