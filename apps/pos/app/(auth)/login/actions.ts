"use server";

import { redirect } from "next/navigation";
import { verifyEmployeePin, type EmployeeRole } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { createSession } from "@/lib/session";

export type LoginResult = { error?: string };

export async function loginAction(pin: string): Promise<LoginResult> {
  if (!/^\d{4}$/.test(pin)) {
    return { error: "أدخل كود مكوّن من 4 أرقام" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, pin_hash, role")
    .eq("is_active", true);

  if (error) {
    return { error: "تعذّر الاتصال بقاعدة البيانات" };
  }

  for (const employee of employees ?? []) {
    const matches = await verifyEmployeePin(pin, employee.pin_hash);
    if (matches) {
      await createSession(employee.id, employee.role as EmployeeRole);
      await supabase.from("audit_log").insert({
        employee_id: employee.id,
        action_type: "employee_login",
        description: "تسجيل دخول بكود PIN",
      });
      redirect("/orders");
    }
  }

  return { error: "كود غير صحيح" };
}
