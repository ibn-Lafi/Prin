"use server";

import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import type { DiscountCodePreview } from "@/lib/types";

/**
 * معاينة فقط — نفس منطق apps/pos بالضبط. الفحص الحقيقي (النافذ، الحد الأدنى،
 * عدد الاستخدامات) يُعاد كاملاً وبشكل ذرّي داخل create_pos_order وقت الإرسال
 * الفعلي، فما نثق بنتيجة هذي الدالة وحدها — إنشاء الطلب الفعلي بالمنيو
 * الإلكتروني معلّق لحين تفعيل بوابة الدفع.
 */
export async function lookupDiscountCodeAction(
  code: string,
  subtotal: number,
): Promise<{ error?: string; preview?: DiscountCodePreview }> {
  const trimmed = code.trim();
  if (!trimmed) return { error: "أدخل كود الخصم" };

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("code, discount_type, value, min_order_amount, valid_from, valid_until, max_uses, times_used, is_active")
    .eq("code", trimmed.toUpperCase())
    .maybeSingle();

  if (!data || !data.is_active) return { error: "كود الخصم غير صالح" };

  const now = new Date();
  if (data.valid_from && now < new Date(data.valid_from)) {
    return { error: "كود الخصم لم يبدأ بعد" };
  }
  if (data.valid_until && now > new Date(data.valid_until)) {
    return { error: "انتهت صلاحية كود الخصم" };
  }
  if (data.max_uses !== null && data.times_used >= data.max_uses) {
    return { error: "تم الوصول للحد الأقصى لاستخدام هذا الكود" };
  }
  if (subtotal < data.min_order_amount) {
    return { error: `الحد الأدنى لاستخدام هذا الكود ${data.min_order_amount} ريال` };
  }

  return {
    preview: {
      code: data.code,
      discountType: data.discount_type as "percentage" | "fixed",
      value: data.value,
    },
  };
}
