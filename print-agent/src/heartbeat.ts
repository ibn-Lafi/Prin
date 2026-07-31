import { createSupabaseServiceRoleClient } from "@brin/database";
import { kitchenPrinter, customerPrinter } from "./printers";

const HEARTBEAT_INTERVAL_MS = 15_000;

const supabase = createSupabaseServiceRoleClient();

async function sendHeartbeat(): Promise<void> {
  const [kitchenConnected, customerConnected] = await Promise.all([
    kitchenPrinter.isPrinterConnected().catch(() => false),
    customerPrinter.isPrinterConnected().catch(() => false),
  ]);

  const { error } = await supabase
    .from("print_agent_status")
    .update({
      last_heartbeat_at: new Date().toISOString(),
      kitchen_printer_connected: kitchenConnected,
      customer_printer_connected: customerConnected,
    })
    .eq("id", 1);

  if (error) {
    console.error(`[heartbeat] تعذّر تحديث حالة جهاز الطباعة: ${error.message}`);
  }
}

export function startHeartbeat(): void {
  void sendHeartbeat();
  setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
}
