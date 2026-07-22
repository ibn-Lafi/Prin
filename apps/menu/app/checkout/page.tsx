import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { CheckoutView } from "@/components/CheckoutView";

export default async function CheckoutPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/checkout");
  }

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("tax_rate_percent")
    .eq("id", 1)
    .single();

  return (
    <CheckoutView
      customerPhone={user.phone ?? ""}
      taxRatePercent={settings?.tax_rate_percent ?? 15}
    />
  );
}
