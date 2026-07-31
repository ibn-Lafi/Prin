"use server";

import { redirect } from "next/navigation";
import { verifyEmployeePin } from "@brin/utils/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { createSession } from "@/lib/session";

export type LoginResult = { error?: string };

export async function loginAction(pin: string): Promise<LoginResult> {
  if (!/^\d{4}$/.test(pin)) {
    return { error: "أدخل كود مكوّن من 4 أرقام" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: managers, error } = await supabase
    .from("employees")
    .select("id, pin_hash")
    .eq("is_active", true)
    .eq("role", "manager");

  if (error) {
    return { error: "تعذّر الاتصال بقاعدة البيانات" };
  }

  for (const manager of managers ?? []) {
    const matches = await verifyEmployeePin(pin, manager.pin_hash);
    if (matches) {
      await createSession(manager.id);
      await supabase.from("audit_log").insert({
        employee_id: manager.id,
        action_type: "employee_login",
        description: "تسجيل دخول بلوحة الإدارة",
      });
      redirect("/");
    }
  }

  return { error: "كود غير صحيح" };
}
