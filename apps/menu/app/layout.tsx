import type { Metadata } from "next";
import "./globals.css";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { MenuHeader } from "../components/MenuHeader";
import { BottomNav } from "../components/BottomNav";

export const metadata: Metadata = {
  title: "BRIN — القائمة الإلكترونية",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pointsBalance: number | null = null;
  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("points_balance")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    pointsBalance = customer?.points_balance ?? 0;
  }

  return (
    <html lang="ar" dir="rtl">
      <body>
        <MenuHeader pointsBalance={pointsBalance} />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
