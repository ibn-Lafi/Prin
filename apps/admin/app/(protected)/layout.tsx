import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";
import { logoutAction } from "./actions";
import { SidebarNav } from "@/components/SidebarNav";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createSupabaseServiceRoleClient();
  const { data: manager } = await supabase
    .from("employees")
    .select("full_name")
    .eq("id", session.employeeId)
    .maybeSingle();

  if (!manager) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-l border-[var(--color-brand-border)] bg-[var(--color-brand-card)]">
        <div className="border-b border-[var(--color-brand-border)] p-4">
          <span className="text-lg font-extrabold tracking-tight text-[var(--color-brand-primary)]">
            BRIN — الإدارة
          </span>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-[var(--color-brand-border)] p-3">
          <p className="mb-2 px-1 text-sm font-semibold">{manager.full_name}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-1.5 rounded-full bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              خروج
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
