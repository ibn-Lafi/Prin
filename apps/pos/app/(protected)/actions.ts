"use server";

import { redirect } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession, clearSession } from "@/lib/session";

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("audit_log").insert({
      employee_id: session.employeeId,
      action_type: "employee_logout",
      description: "تسجيل خروج",
    });
  }
  await clearSession();
  redirect("/login");
}
