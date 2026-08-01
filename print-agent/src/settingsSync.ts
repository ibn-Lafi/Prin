import { createSupabaseServiceRoleClient } from "@brin/database";
import { configurePrinters } from "./printers";

const SYNC_INTERVAL_MS = 15_000;

const supabase = createSupabaseServiceRoleClient();

async function syncPrinterSettings(): Promise<void> {
  const { data, error } = await supabase
    .from("print_agent_status")
    .select("kitchen_printer_interface, customer_printer_interface")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return;

  configurePrinters(data.kitchen_printer_interface, data.customer_printer_interface);
}

export function startSettingsSync(): void {
  void syncPrinterSettings();
  setInterval(() => void syncPrinterSettings(), SYNC_INTERVAL_MS);
}
