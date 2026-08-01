import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { AccountView } from "@/components/AccountView";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  const [{ data: customer }, { data: orders }] = await Promise.all([
    supabase
      .from("customers")
      .select("full_name, phone, points_balance")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
    supabase.from("orders").select("total"),
  ]);

  const totalSpent = (orders ?? []).reduce((sum, order) => sum + order.total, 0);

  return (
    <AccountView
      fullName={customer?.full_name ?? ""}
      phone={customer?.phone ?? user.phone ?? ""}
      pointsBalance={customer?.points_balance ?? 0}
      totalSpent={totalSpent}
    />
  );
}
