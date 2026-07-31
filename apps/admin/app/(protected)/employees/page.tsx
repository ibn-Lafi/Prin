import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { EmployeesManager } from "@/components/EmployeesManager";

export default async function EmployeesPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الموظفون</h1>
      <EmployeesManager employees={employees ?? []} />
    </div>
  );
}
