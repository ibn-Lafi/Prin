"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export async function adjustPointsAction(
  customerId: string,
  pointsChange: number,
  reason: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  if (!Number.isFinite(pointsChange) || pointsChange === 0) {
    return { error: "أدخل عدد نقاط صحيح (موجب للإضافة، سالب للخصم)" };
  }
  if (!reason.trim()) return { error: "سبب التعديل مطلوب" };

  const supabase = createSupabaseServiceRoleClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("points_balance")
    .eq("id", customerId)
    .maybeSingle();

  if (!customer) return { error: "العميل غير موجود" };
  if (customer.points_balance + pointsChange < 0) {
    return { error: `الرصيد الحالي (${customer.points_balance}) لا يكفي لهذا الخصم` };
  }

  const { error } = await supabase.from("loyalty_points").insert({
    customer_id: customerId,
    points_change: pointsChange,
    reason: "manual_adjustment",
    created_by_employee_id: session.employeeId,
    notes: reason.trim(),
  });

  if (error) return { error: "تعذّر تعديل الرصيد" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "manual_points_adjustment",
    description: `تعديل نقاط يدوي (${pointsChange > 0 ? "+" : ""}${pointsChange}): ${reason.trim()}`,
    metadata: { customer_id: customerId },
  });

  revalidatePath(`/customers/${customerId}`);
  return {};
}
