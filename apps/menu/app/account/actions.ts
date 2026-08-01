"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

export type ActionResult = { error?: string };

export async function updateNameAction(fullName: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const trimmed = fullName.trim();
  if (!trimmed) return { error: "الاسم مطلوب" };
  if (trimmed.length > 100) return { error: "الاسم طويل جداً" };

  const serviceClient = createSupabaseServiceRoleClient();
  const { error } = await serviceClient
    .from("customers")
    .update({ full_name: trimmed })
    .eq("auth_user_id", user.id);

  if (error) return { error: "تعذّر حفظ الاسم" };

  revalidatePath("/account");
  return {};
}
