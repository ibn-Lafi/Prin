"use server";

import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export type StationPrinterSettings = {
  kitchenPrinterInterface: string;
  customerPrinterInterface: string;
};

/** إعدادات الطباعة الآن لكل جهاز كاشير على حدة (station_id مخزّن محلياً
 * بمتصفح كل جهاز) — بدل إعداد واحد مشترك من لوحة الإدارة. */
export async function getStationPrinterSettingsAction(
  stationId: string,
): Promise<StationPrinterSettings | null> {
  const session = await getSession();
  if (!session) return null;
  if (!stationId.trim()) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("print_agent_status")
    .select("kitchen_printer_interface, customer_printer_interface")
    .eq("id", stationId)
    .maybeSingle();

  if (!data) return null;

  return {
    kitchenPrinterInterface: data.kitchen_printer_interface ?? "",
    customerPrinterInterface: data.customer_printer_interface ?? "",
  };
}

export async function saveStationPrinterSettingsAction(
  stationId: string,
  input: StationPrinterSettings,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const trimmedStationId = stationId.trim();
  if (!trimmedStationId) return { error: "معرّف الجهاز مطلوب" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("print_agent_status").upsert(
    {
      id: trimmedStationId,
      kitchen_printer_interface: input.kitchenPrinterInterface.trim() || null,
      customer_printer_interface: input.customerPrinterInterface.trim() || null,
    },
    { onConflict: "id" },
  );

  if (error) return { error: "تعذّر حفظ إعدادات الطباعة" };

  return {};
}
