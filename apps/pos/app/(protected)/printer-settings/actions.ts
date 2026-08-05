"use server";

import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

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
