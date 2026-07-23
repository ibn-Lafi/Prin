import type { Metadata } from "next";
import "./globals.css";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { AccountBadgeLink } from "../components/AccountBadgeLink";
import { CartBadgeLink } from "../components/CartBadgeLink";
import { PointsBadge } from "../components/PointsBadge";

export const metadata: Metadata = {
  title: "BRIN — المنيو الإلكتروني",
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[var(--color-brand-background)]/95 px-4 backdrop-blur">
          <span className="text-xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
            BRIN
          </span>
          <div className="flex items-center gap-2">
            {pointsBalance !== null && <PointsBadge points={pointsBalance} />}
            <AccountBadgeLink />
            <CartBadgeLink />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
