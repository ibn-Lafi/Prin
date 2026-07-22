import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { CartView } from "@/components/CartView";

export default async function CartPage() {
  const supabase = await getSupabaseServerClient();
  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("tax_rate_percent")
    .eq("id", 1)
    .single();

  // نسبة 15% افتراضية آمنة (ضريبة القيمة المضافة السعودية القياسية) لو تعذّر
  // جلب الإعدادات — لا داعي لتعطيل صفحة السلة كاملة بسبب هذا فقط.
  return <CartView taxRatePercent={settings?.tax_rate_percent ?? 15} />;
}
