import { createSupabaseServiceRoleClient } from "@brin/database";
import { config } from "./config";
import { getPrinter } from "./printers";

const HEARTBEAT_INTERVAL_MS = 15_000;

const supabase = createSupabaseServiceRoleClient();

async function sendHeartbeat(): Promise<void> {
  const printer = getPrinter();
  const printerConnected = printer ? await printer.isPrinterConnected().catch(() => false) : false;

  const { error } = await supabase
    .from("print_agent_status")
    .update({
      last_heartbeat_at: new Date().toISOString(),
      printer_connected: printerConnected,
    })
    .eq("id", config.stationId);

  if (error) {
    console.error(`[heartbeat] تعذّر تحديث حالة جهاز الطباعة: ${error.message}`);
  }
}

export function startHeartbeat(): void {
  void sendHeartbeat();
  setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
}
