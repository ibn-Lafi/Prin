import { redirect } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";
import { IncomingOrdersWatcher } from "@/components/IncomingOrdersWatcher";
import { OnlineOrdersHeaderList } from "@/components/OnlineOrdersHeaderList";
import { PrintJobProcessor } from "@/components/PrintJobProcessor";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createSupabaseServiceRoleClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("full_name, role")
    .eq("id", session.employeeId)
    .maybeSingle();

  if (!employee) redirect("/login");

  const roleLabel = employee.role === "manager" ? "مدير" : "موظف";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-brand-border)] bg-[var(--color-brand-card)] px-4">
        <span className="text-xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
          BRIN — الكاشير
        </span>
        <div className="flex items-center gap-3">
          <OnlineOrdersHeaderList />
          <Link
            href="/printer-settings"
            aria-label="إعدادات الطباعة"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-background)] ring-1 ring-[var(--color-brand-border)]"
          >
            <Printer className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
          </Link>
          <span className="text-sm">
            <span className="font-semibold">{employee.full_name}</span>
            <span className="mr-1 text-[var(--color-brand-muted)]">({roleLabel})</span>
          </span>
          <LogoutButton />
        </div>
      </header>
      {children}
      <IncomingOrdersWatcher />
      <PrintJobProcessor />
    </div>
  );
}
