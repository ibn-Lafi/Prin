"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export type DiscountCodeInput = {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
};

function validate(input: DiscountCodeInput): string | null {
  if (!input.code.trim()) return "الكود مطلوب";
  if (!Number.isFinite(input.value) || input.value <= 0) return "القيمة يجب أن تكون رقماً أكبر من صفر";
  if (input.discountType === "percentage" && input.value > 100) {
    return "نسبة الخصم لا يمكن أن تتجاوز 100%";
  }
  if (!Number.isFinite(input.minOrderAmount) || input.minOrderAmount < 0) {
    return "الحد الأدنى للطلب يجب أن يكون رقماً صحيحاً";
  }
  if (input.validFrom && input.validUntil && input.validUntil < input.validFrom) {
    return "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء";
  }
  if (input.maxUses !== null && (!Number.isFinite(input.maxUses) || input.maxUses <= 0)) {
    return "الحد الأقصى للاستخدام يجب أن يكون رقماً أكبر من صفر";
  }
  return null;
}

export async function createDiscountCodeAction(input: DiscountCodeInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("discount_codes").insert({
    code: input.code.trim().toUpperCase(),
    discount_type: input.discountType,
    value: input.value,
    min_order_amount: input.minOrderAmount,
    valid_from: input.validFrom,
    valid_until: input.validUntil,
    max_uses: input.maxUses,
  });

  if (error) {
    if (error.code === "23505") return { error: "هذا الكود مستخدم مسبقاً" };
    return { error: "تعذّر إنشاء الكود" };
  }

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة كود خصم جديد: ${input.code.trim().toUpperCase()}`,
  });

  revalidatePath("/offers");
  return {};
}

export async function updateDiscountCodeAction(
  codeId: string,
  input: DiscountCodeInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("discount_codes")
    .update({
      code: input.code.trim().toUpperCase(),
      discount_type: input.discountType,
      value: input.value,
      min_order_amount: input.minOrderAmount,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
      max_uses: input.maxUses,
    })
    .eq("id", codeId);

  if (error) {
    if (error.code === "23505") return { error: "هذا الكود مستخدم مسبقاً" };
    return { error: "تعذّر تحديث الكود" };
  }

  revalidatePath("/offers");
  return {};
}

export async function toggleDiscountCodeActiveAction(
  codeId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("discount_codes")
    .update({ is_active: isActive })
    .eq("id", codeId);

  if (error) return { error: "تعذّر التحديث" };

  revalidatePath("/offers");
  return {};
}
