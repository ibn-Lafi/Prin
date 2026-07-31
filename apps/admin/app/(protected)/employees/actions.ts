"use server";

import { revalidatePath } from "next/cache";
import { hashEmployeePin } from "@brin/utils/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

export async function createEmployeeAction(input: {
  fullName: string;
  role: "manager" | "staff";
  pin: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const fullName = input.fullName.trim();
  if (!fullName) return { error: "الاسم مطلوب" };
  if (!/^\d{4}$/.test(input.pin)) return { error: "رمز PIN يجب أن يكون 4 أرقام" };

  const supabase = createSupabaseServiceRoleClient();
  const pinHash = await hashEmployeePin(input.pin);

  const { error } = await supabase.from("employees").insert({
    full_name: fullName,
    role: input.role,
    pin_hash: pinHash,
  });

  if (error) return { error: "تعذّر إنشاء الموظف" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة موظف جديد: ${fullName} (${input.role === "manager" ? "مدير" : "موظف"})`,
  });

  revalidatePath("/employees");
  return {};
}

export async function toggleEmployeeActiveAction(
  employeeId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const supabase = createSupabaseServiceRoleClient();

  if (!isActive) {
    if (employeeId === session.employeeId) {
      return { error: "لا يمكنك تعطيل حسابك الخاص" };
    }

    const { data: target } = await supabase
      .from("employees")
      .select("role")
      .eq("id", employeeId)
      .maybeSingle();

    if (target?.role === "manager") {
      const { count } = await supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("role", "manager")
        .eq("is_active", true)
        .neq("id", employeeId);

      if (!count || count === 0) {
        return { error: "لا يمكن تعطيل آخر حساب مدير نشط" };
      }
    }
  }

  const { error } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", employeeId);

  if (error) return { error: "تعذّر التحديث" };

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `${isActive ? "تفعيل" : "تعطيل"} موظف`,
    metadata: { employee_id: employeeId },
  });

  revalidatePath("/employees");
  return {};
}
