"use server";

import { redirect } from "next/navigation";
import { verifyEmployeePin, type EmployeeRole } from "@brin/utils/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { createSession } from "@/lib/session";

export type LoginResult = { error?: string };
export type EmployeeOption = { id: string; full_name: string };
export type BranchOption = { id: string; name: string };

/** قائمة الفروع النشطة — تُعرض بشاشة اختيار فرع هذا الجهاز (قبل أي تسجيل
 * دخول موظف)، فما تحتاج جلسة موظف أصلاً. */
export async function listActiveBranchesAction(): Promise<BranchOption[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("display_order");

  return data ?? [];
}

/** قائمة موظفي الكاشير النشطين (الاسم فقط) لعرضها كخطوة اختيار قبل إدخال
 * الـPIN — الموظفون بصلاحية "مدير" مستثنون عمداً، لأن دخولهم يصير من لوحة
 * الإدارة بحسابهم المنفصل (اسم مستخدم/كلمة مرور)، لا من شاشة الكاشير هذي.
 * تُعرض قبل أي مصادقة (نفس مستوى حساسية شاشة الدخول نفسها)، والتحقق الفعلي
 * من الهوية يبقى بالـPIN وحده. */
export async function listActiveEmployeesAction(): Promise<EmployeeOption[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("is_active", true)
    .eq("role", "staff")
    .order("full_name");

  return data ?? [];
}

export async function loginAction(employeeId: string, pin: string): Promise<LoginResult> {
  if (!/^\d{4}$/.test(pin)) {
    return { error: "أدخل كود مكوّن من 4 أرقام" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, pin_hash, role")
    .eq("id", employeeId)
    .eq("is_active", true)
    .eq("role", "staff")
    .maybeSingle();

  if (error) {
    return { error: "تعذّر الاتصال بقاعدة البيانات" };
  }
  if (!employee) {
    return { error: "الحساب غير متاح" };
  }

  const matches = await verifyEmployeePin(pin, employee.pin_hash);
  if (!matches) {
    return { error: "كود غير صحيح" };
  }

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
