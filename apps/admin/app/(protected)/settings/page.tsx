import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const [{ data: settings }, { data: printerStatus }] = await Promise.all([
    supabase
      .from("restaurant_settings")
      .select("restaurant_name, vat_number, tax_rate_percent, opening_time, closing_time, is_accepting_orders")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("print_agent_status")
      .select("kitchen_printer_interface, customer_printer_interface")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الإعدادات العامة</h1>
      {settings && (
        <SettingsForm
          settings={{
            ...settings,
            kitchen_printer_interface: printerStatus?.kitchen_printer_interface ?? null,
            customer_printer_interface: printerStatus?.customer_printer_interface ?? null,
          }}
        />
      )}
    </div>
  );
}
