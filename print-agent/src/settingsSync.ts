import { createSupabaseServiceRoleClient } from "@brin/database";
import { config } from "./config";
import { configurePrinter } from "./printers";

const SYNC_INTERVAL_MS = 15_000;

const supabase = createSupabaseServiceRoleClient();

// فرع هذه المحطة (يُضبط من نظام الكاشير، صفحة إعدادات الطباعة) — يُخزَّن
// بالذاكرة ويُقرأ من jobQueue.ts لتقييد مهام الطباعة غير المُسندة (طلبات
// إلكترونية بدون جهاز محدد) بنفس الفرع فقط، بدل أي محطة شغّالة بالمطعم كله.
let stationBranchId: string | null = null;

export function getStationBranchId(): string | null {
  return stationBranchId;
}

/** يضمن وجود صف حالة لهذا الجهاز حتى لو ما أحد سجّله بعد من صفحة إعدادات
 * الطباعة بالكاشير — يخلي ترتيب التشغيل (عامل الطباعة قبل أو بعد الكاشير)
 * غير مهم. */
async function ensureStationRow(): Promise<void> {
  await supabase
    .from("print_agent_status")
    .upsert({ id: config.stationId }, { onConflict: "id", ignoreDuplicates: true });
}

async function syncBranch(): Promise<void> {
  const { data, error } = await supabase
    .from("print_agent_status")
    .select("branch_id")
    .eq("id", config.stationId)
    .maybeSingle();

  if (error || !data) return;

  stationBranchId = data.branch_id;
}

export function startSettingsSync(): void {
  void ensureStationRow().then(() => syncBranch());
  configurePrinter();
  setInterval(() => {
    void syncBranch();
    configurePrinter();
  }, SYNC_INTERVAL_MS);
}
