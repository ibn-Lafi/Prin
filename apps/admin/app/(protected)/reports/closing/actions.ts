"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

type OrderPaymentsRow = { payments: { method: string; amount: number }[] };

async function computeExpectedCash(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  closingDate: string,
): Promise<number> {
  const { data: rawOrders } = await supabase
    .from("orders")
    .select("payments ( method, amount )")
    .in("status", ["received", "accepted"])
    .eq("order_date", closingDate);

  const orders = (rawOrders ?? []) as unknown as OrderPaymentsRow[];

  return orders.reduce((sum, order) => {
    const cashAmount = order.payments
      .filter((p) => p.method === "cash")
      .reduce((s, p) => s + p.amount, 0);
    return sum + cashAmount;
  }, 0);
}

/** يحسب الكاش المتوقع يومياً من الدفعات الفعلية — لا يثق بأي رقم مُرسل من المتصفح. */
export async function saveCashClosingAction(input: {
  closingDate: string;
  actualCash: number;
  notes: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  if (!input.closingDate) return { error: "التاريخ مطلوب" };
  if (!Number.isFinite(input.actualCash) || input.actualCash < 0) {
    return { error: "المبلغ الفعلي يجب أن يكون رقماً صحيحاً" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const expectedCash = await computeExpectedCash(supabase, input.closingDate);

  const { error } = await supabase.from("cash_closings").upsert(
    {
      closing_date: input.closingDate,
      expected_cash: expectedCash,
      actual_cash: input.actualCash,
      closed_by_employee_id: session.employeeId,
      notes: input.notes.trim() || null,
    },
    { onConflict: "closing_date" },
  );

  if (error) return { error: "تعذّر حفظ الإقفال" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إقفال يومي بتاريخ ${input.closingDate}`,
  });

  revalidatePath("/reports/closing");
  return {};
}
