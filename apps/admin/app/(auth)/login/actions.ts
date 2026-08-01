"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@brin/utils/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { createSession } from "@/lib/session";

export type LoginResult = { error?: string };

export async function loginAction(username: string, password: string): Promise<LoginResult> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password) {
    return { error: "أدخل اسم المستخدم وكلمة المرور" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: manager, error } = await supabase
    .from("employees")
    .select("id, password_hash")
    .eq("is_active", true)
    .eq("role", "manager")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (error) {
    return { error: "تعذّر الاتصال بقاعدة البيانات" };
  }

  if (!manager?.password_hash || !(await verifyPassword(password, manager.password_hash))) {
    return { error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  }

  await createSession(manager.id);
  await supabase.from("audit_log").insert({
    employee_id: manager.id,
    action_type: "employee_login",
    description: "تسجيل دخول بلوحة الإدارة",
  });
  redirect("/");
}
