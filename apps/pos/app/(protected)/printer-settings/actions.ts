"use server";

import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export type StationPrinterSettings = {
  printerInterface: string;
};

/** إعدادات الطباعة الآن لكل جهاز كاشير على حدة (station_id مخزّن محلياً
 * بمتصفح كل جهاز) — بدل إعداد واحد مشترك من لوحة الإدارة. طابعة فعلية
 * واحدة فقط لكل جهاز، تطبع فاتورتي المطبخ والعميل تباعاً. */
export async function getStationPrinterSettingsAction(
  stationId: string,
): Promise<StationPrinterSettings | null> {
  const session = await getSession();
  if (!session) return null;
  if (!stationId.trim()) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("print_agent_status")
    .select("printer_interface")
    .eq("id", stationId)
    .maybeSingle();

  if (!data) return null;

  return {
    printerInterface: data.printer_interface ?? "",
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
      printer_interface: input.printerInterface.trim() || null,
    },
    { onConflict: "id" },
  );

  if (error) return { error: "تعذّر حفظ إعدادات الطباعة" };

  return {};
}

/** يربط محطة الطباعة (station_id) بفرع هذا الجهاز — يضمن أن مهام الطباعة
 * غير المُسندة (طلبات إلكترونية بدون جهاز محدد) ما تُطبع إلا على طابعات
 * نفس الفرع. يُستدعى تلقائياً كلما تغيّر فرع الجهاز أو معرّف المحطة. */
export async function linkStationBranchAction(stationId: string, branchId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const trimmedStationId = stationId.trim();
  if (!trimmedStationId) return { error: "معرّف الجهاز مطلوب" };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("print_agent_status")
    .upsert({ id: trimmedStationId, branch_id: branchId }, { onConflict: "id" });

  if (error) return { error: "تعذّر ربط الفرع بمحطة الطباعة" };

  return {};
}
