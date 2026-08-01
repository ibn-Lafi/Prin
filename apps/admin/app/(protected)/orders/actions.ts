"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

/**
 * إلغاء طلب (صلاحية مدير فقط — كل لوحة الإدارة مقيّدة لذلك أصلاً) — يتطلب سبباً
 * إلزامياً ويُسجَّل بـ Audit Log. الاسترجاع التلقائي عبر Moyasar API (للطلبات
 * الإلكترونية) مؤجَّل لحين تفعيل الدفع الإلكتروني — غير مطبَّق هنا عمداً، لأنه
 * لا توجد بوابة دفع فعلية نتصل بها بعد. عكس نقاط الولاء المكتسبة/المستبدلة
 * بهذا الطلب "أفضل جهد" — لا يمنع نجاح الإلغاء نفسه لو فشل (مثلاً لو العميل
 * صرف رصيده بطلب لاحق قبل الإلغاء).
 */
export async function cancelOrderAction(orderId: string, reason: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const trimmedReason = reason.trim();
  if (!trimmedReason) return { error: "سبب الإلغاء مطلوب" };

  const supabase = createSupabaseServiceRoleClient();

  const { data: cancelled, error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_by_employee_id: session.employeeId,
      cancellation_reason: trimmedReason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("status", "cancelled")
    .select("id, customer_id")
    .maybeSingle();

  if (error) return { error: "تعذّر إلغاء الطلب" };
  if (!cancelled) return { error: "الطلب ملغى مسبقاً أو غير موجود" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "order_cancel",
    description: `إلغاء طلب: ${trimmedReason}`,
    related_order_id: orderId,
  });

  if (cancelled.customer_id) {
    const { data: loyaltyRows } = await supabase
      .from("loyalty_points")
      .select("points_change")
      .eq("order_id", orderId);

    const netChange = (loyaltyRows ?? []).reduce((sum, row) => sum + row.points_change, 0);
    if (netChange !== 0) {
      await supabase.from("loyalty_points").insert({
        customer_id: cancelled.customer_id,
        points_change: -netChange,
        reason: "manual_adjustment",
        order_id: orderId,
        created_by_employee_id: session.employeeId,
        notes: "عكس نقاط بسبب إلغاء الطلب",
      });
      // لا نتحقق من نجاح هذا الإدراج عمداً — لو فشل (مثلاً رصيد العميل غير
      // كافٍ للعكس الكامل لأنه صرفه بطلب لاحق) يبقى الطلب ملغى بنجاح، ويحتاج
      // تعديل يدوي لرصيد النقاط لاحقاً.
    }
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return {};
}
