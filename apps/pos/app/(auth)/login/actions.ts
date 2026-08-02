"use server";

import { redirect } from "next/navigation";
import { verifyEmployeePin, type EmployeeRole } from "@brin/utils/server";
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

      // يغلق أي جلسة عمل سابقة عالقة مفتوحة لنفس الموظف (مثلاً بسبب إغلاق
      // المتصفح بدون تسجيل خروج) قبل ما نفتح جلسة جديدة — يضمن وجود جلسة
      // مفتوحة واحدة فقط لكل موظف بأي وقت.
      await supabase
        .from("cashier_shifts")
        .update({ closed_at: new Date().toISOString() })
        .eq("employee_id", employee.id)
        .is("closed_at", null);

      await supabase.from("cashier_shifts").insert({ employee_id: employee.id });

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
