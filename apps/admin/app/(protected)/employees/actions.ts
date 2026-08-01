"use server";

import { revalidatePath } from "next/cache";
import { hashEmployeePin, hashPassword } from "@brin/utils/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,30}$/;

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export async function createEmployeeAction(input: {
  fullName: string;
  role: "manager" | "staff";
  pin: string;
  username: string;
  password: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const fullName = input.fullName.trim();
  if (!fullName) return { error: "الاسم مطلوب" };
  if (!/^\d{4}$/.test(input.pin)) return { error: "رمز PIN يجب أن يكون 4 أرقام" };

  const username = input.username.trim().toLowerCase();
  if (input.role === "manager") {
    if (!USERNAME_PATTERN.test(username)) {
      return { error: "اسم المستخدم يجب أن يكون 3-30 حرف/رقم إنجليزي بدون مسافات" };
    }
    if (input.password.length < 8) {
      return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
    }
  }

  const supabase = createSupabaseServiceRoleClient();
  const pinHash = await hashEmployeePin(input.pin);

  const { error } = await supabase.from("employees").insert({
    full_name: fullName,
    role: input.role,
    pin_hash: pinHash,
    username: input.role === "manager" ? username : null,
    password_hash: input.role === "manager" ? await hashPassword(input.password) : null,
  });

  if (error) {
    if (isUniqueViolation(error)) return { error: "اسم المستخدم مستخدم مسبقاً" };
    return { error: "تعذّر إنشاء الموظف" };
  }

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `إضافة موظف جديد: ${fullName} (${input.role === "manager" ? "مدير" : "موظف"})`,
  });

  revalidatePath("/employees");
  return {};
}

export async function updateEmployeeAction(
  employeeId: string,
  input: {
    fullName: string;
    role: "manager" | "staff";
    newPin: string;
    username: string;
    newPassword: string;
  },
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const fullName = input.fullName.trim();
  if (!fullName) return { error: "الاسم مطلوب" };
  if (input.newPin && !/^\d{4}$/.test(input.newPin)) {
    return { error: "رمز PIN يجب أن يكون 4 أرقام" };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: target } = await supabase
    .from("employees")
    .select("role, username")
    .eq("id", employeeId)
    .maybeSingle();

  if (input.role === "staff" && target?.role === "manager") {
    const { count } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("role", "manager")
      .eq("is_active", true)
      .neq("id", employeeId);

    if (!count || count === 0) {
      return { error: "لا يمكن تنزيل آخر حساب مدير نشط لصلاحية موظف" };
    }
  }

  const username = input.username.trim().toLowerCase();
  if (input.role === "manager") {
    const hasExistingUsername = !!target?.username;
    if (!hasExistingUsername || username !== target?.username) {
      if (!USERNAME_PATTERN.test(username)) {
        return { error: "اسم المستخدم يجب أن يكون 3-30 حرف/رقم إنجليزي بدون مسافات" };
      }
    }
    if (!hasExistingUsername && !input.newPassword) {
      return { error: "كلمة المرور مطلوبة لحساب المدير الجديد" };
    }
    if (input.newPassword && input.newPassword.length < 8) {
      return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
    }
  }

  const updatePayload: {
    full_name: string;
    role: "manager" | "staff";
    pin_hash?: string;
    username?: string;
    password_hash?: string;
  } = {
    full_name: fullName,
    role: input.role,
  };
  if (input.newPin) {
    updatePayload.pin_hash = await hashEmployeePin(input.newPin);
  }
  if (input.role === "manager") {
    updatePayload.username = username;
    if (input.newPassword) {
      updatePayload.password_hash = await hashPassword(input.newPassword);
    }
  }

  const { error } = await supabase.from("employees").update(updatePayload).eq("id", employeeId);

  if (error) {
    if (isUniqueViolation(error)) return { error: "اسم المستخدم مستخدم مسبقاً" };
    return { error: "تعذّر تحديث الموظف" };
  }

  await supabase.from("audit_log").insert({
    employee_id: session.employeeId,
    action_type: "settings_change",
    description: `تعديل بيانات موظف: ${fullName}${input.newPin ? " (تغيير PIN)" : ""}`,
    metadata: { employee_id: employeeId },
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
