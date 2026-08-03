import { createSupabaseServiceRoleClient } from "@brin/database";
import { config } from "./config";
import { configurePrinter } from "./printers";

const SYNC_INTERVAL_MS = 15_000;

const supabase = createSupabaseServiceRoleClient();

/** يضمن وجود صف حالة لهذا الجهاز حتى لو ما أحد سجّله بعد من صفحة إعدادات
 * الطباعة بالكاشير — يخلي ترتيب التشغيل (عامل الطباعة قبل أو بعد الكاشير)
 * غير مهم. */
async function ensureStationRow(): Promise<void> {
  await supabase
    .from("print_agent_status")
    .upsert({ id: config.stationId }, { onConflict: "id", ignoreDuplicates: true });
}

async function syncPrinterSettings(): Promise<void> {
  const { data, error } = await supabase
    .from("print_agent_status")
    .select("printer_interface")
    .eq("id", config.stationId)
    .maybeSingle();

  if (error || !data) return;

  configurePrinter(data.printer_interface);
}

export function startSettingsSync(): void {
  void ensureStationRow().then(() => syncPrinterSettings());
  setInterval(() => void syncPrinterSettings(), SYNC_INTERVAL_MS);
}
