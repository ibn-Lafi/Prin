"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export type RewardInput = {
  name: string;
  description: string;
  pointsCost: number;
  discountAmount: number;
  imageUrl: string;
  productId: string | null;
  comboId: string | null;
};

function validate(input: RewardInput): string | null {
  if (!Number.isFinite(input.pointsCost) || input.pointsCost <= 0) {
    return "تكلفة النقاط يجب أن تكون رقماً أكبر من صفر";
  }
  const isLinked = input.productId !== null || input.comboId !== null;
  if (!isLinked) {
    if (!input.name.trim()) return "اسم المكافأة مطلوب";
    if (!Number.isFinite(input.discountAmount) || input.discountAmount < 0) {
      return "قيمة الخصم يجب أن تكون رقماً صحيحاً";
    }
  }
  return null;
}

export async function createRewardAction(input: RewardInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const isLinked = input.productId !== null || input.comboId !== null;
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("rewards").insert({
    name: isLinked ? null : input.name.trim(),
    description: isLinked ? null : input.description.trim() || null,
    points_cost: input.pointsCost,
    discount_amount: isLinked ? 0 : input.discountAmount,
    image_url: isLinked ? null : input.imageUrl.trim() || null,
    product_id: input.productId,
    combo_id: input.comboId,
  });

  if (error) return { error: "تعذّر إنشاء المكافأة" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة مكافأة جديدة: ${input.name.trim()}`,
  });

  revalidatePath("/rewards");
  return {};
}

export async function updateRewardAction(rewardId: string, input: RewardInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const isLinked = input.productId !== null || input.comboId !== null;
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("rewards")
    .update({
      name: isLinked ? null : input.name.trim(),
      description: isLinked ? null : input.description.trim() || null,
      points_cost: input.pointsCost,
      discount_amount: isLinked ? 0 : input.discountAmount,
      image_url: isLinked ? null : input.imageUrl.trim() || null,
      product_id: input.productId,
      combo_id: input.comboId,
    })
    .eq("id", rewardId);

  if (error) return { error: "تعذّر تحديث المكافأة" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `تعديل مكافأة: ${input.name.trim()}`,
    metadata: { reward_id: rewardId },
  });

  revalidatePath("/rewards");
  return {};
}

export async function toggleRewardActiveAction(
  rewardId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("rewards").update({ is_active: isActive }).eq("id", rewardId);
  if (error) return { error: "تعذّر التحديث" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `${isActive ? "تفعيل" : "تعطيل"} مكافأة`,
    metadata: { reward_id: rewardId },
  });

  revalidatePath("/rewards");
  return {};
}
