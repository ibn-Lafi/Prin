"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export type SettingsInput = {
  restaurantName: string;
  vatNumber: string;
  taxRatePercent: number;
  openingTime: string;
  closingTime: string;
  isAcceptingOrders: boolean;
};

export async function updateSettingsAction(input: SettingsInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  if (!input.restaurantName.trim()) return { error: "اسم المطعم مطلوب" };
  if (!Number.isFinite(input.taxRatePercent) || input.taxRatePercent < 0) {
    return { error: "نسبة الضريبة يجب أن تكون رقماً صحيحاً" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("restaurant_settings")
    .update({
      restaurant_name: input.restaurantName.trim(),
      vat_number: input.vatNumber.trim() || null,
      tax_rate_percent: input.taxRatePercent,
      opening_time: input.openingTime,
      closing_time: input.closingTime,
      is_accepting_orders: input.isAcceptingOrders,
    })
    .eq("id", 1);

  if (error) return { error: "تعذّر حفظ الإعدادات" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: "تعديل الإعدادات العامة للمطعم",
  });

  revalidatePath("/settings");
  return {};
}
