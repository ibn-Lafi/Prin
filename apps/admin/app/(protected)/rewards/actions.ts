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
};

function validate(input: RewardInput): string | null {
  if (!input.name.trim()) return "اسم المكافأة مطلوب";
  if (!Number.isFinite(input.pointsCost) || input.pointsCost <= 0) {
    return "تكلفة النقاط يجب أن تكون رقماً أكبر من صفر";
  }
  if (!Number.isFinite(input.discountAmount) || input.discountAmount < 0) {
    return "قيمة الخصم يجب أن تكون رقماً صحيحاً";
  }
  return null;
}

export async function createRewardAction(input: RewardInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("rewards").insert({
    name: input.name.trim(),
    description: input.description.trim() || null,
    points_cost: input.pointsCost,
    discount_amount: input.discountAmount,
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

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("rewards")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      points_cost: input.pointsCost,
      discount_amount: input.discountAmount,
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
