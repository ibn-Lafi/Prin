import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("restaurant_name, vat_number, tax_rate_percent, opening_time, closing_time, is_accepting_orders")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الإعدادات العامة</h1>
      {settings && <SettingsForm settings={settings} />}
    </div>
  );
}
