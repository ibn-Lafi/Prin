"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };
export type CreateResult = { error?: string; id?: string };

export type BranchInput = {
  name: string;
  address: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  isAcceptingOrders: boolean;
  displayOrder: number;
};

function validateBranch(input: BranchInput): string | null {
  if (!input.name.trim()) return "اسم الفرع مطلوب";
  return null;
}

export async function createBranchAction(input: BranchInput): Promise<CreateResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateBranch(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({
      name: input.name.trim(),
      address: input.address.trim() || null,
      phone: input.phone.trim() || null,
      opening_time: input.openingTime,
      closing_time: input.closingTime,
      is_accepting_orders: input.isAcceptingOrders,
      display_order: input.displayOrder,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "تعذّر إنشاء الفرع" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة فرع جديد: ${input.name.trim()}`,
  });

  revalidatePath("/branches");
  revalidatePath("/");
  return { id: data.id };
}

export async function updateBranchAction(branchId: string, input: BranchInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validateBranch(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("branches")
    .update({
      name: input.name.trim(),
      address: input.address.trim() || null,
      phone: input.phone.trim() || null,
      opening_time: input.openingTime,
      closing_time: input.closingTime,
      is_accepting_orders: input.isAcceptingOrders,
      display_order: input.displayOrder,
    })
    .eq("id", branchId);

  if (error) return { error: "تعذّر تحديث الفرع" };

  revalidatePath("/branches");
  revalidatePath("/");
  return {};
}

export async function toggleBranchActiveAction(branchId: string, isActive: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("branches").update({ is_active: isActive }).eq("id", branchId);

  if (error) return { error: "تعذّر التحديث" };

  revalidatePath("/branches");
  revalidatePath("/");
  return {};
}

/** تبديل سريع لاستقبال طلبات المنيو الإلكتروني بضغطة واحدة لفرع محدد — نفس
 * فكرة toggleAcceptingOrdersAction السابقة لكن لكل فرع على حدة الآن. */
export async function toggleBranchAcceptingOrdersAction(
  branchId: string,
  next: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("branches")
    .update({ is_accepting_orders: next })
    .eq("id", branchId);

  if (error) return { error: "تعذّر تحديث الحالة" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: next ? "إعادة تفعيل استقبال طلبات فرع" : "إغلاق استقبال طلبات فرع يدوياً",
    metadata: { branch_id: branchId },
  });

  revalidatePath("/");
  revalidatePath("/branches");
  return {};
}
