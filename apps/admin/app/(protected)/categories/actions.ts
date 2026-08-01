"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export async function createCategoryAction(input: {
  name: string;
  displayOrder: number;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const name = input.name.trim();
  if (!name) return { error: "اسم الفئة مطلوب" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("categories").insert({
    name,
    display_order: input.displayOrder,
  });

  if (error) return { error: "تعذّر إنشاء الفئة" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة فئة جديدة: ${name}`,
  });

  revalidatePath("/categories");
  return {};
}

export async function updateCategoryAction(
  categoryId: string,
  input: { name: string; displayOrder: number },
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const name = input.name.trim();
  if (!name) return { error: "اسم الفئة مطلوب" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, display_order: input.displayOrder })
    .eq("id", categoryId);

  if (error) return { error: "تعذّر تحديث الفئة" };

  revalidatePath("/categories");
  return {};
}

export async function toggleCategoryActiveAction(
  categoryId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId);

  if (error) return { error: "تعذّر التحديث" };

  revalidatePath("/categories");
  return {};
}
