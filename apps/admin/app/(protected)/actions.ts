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
      description: "تسجيل خروج من لوحة الإدارة",
    });
  }
  await clearSession();
  redirect("/login");
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type UploadImageResult = { error?: string; url?: string };

/** يرفع صورة صنف/وجبة/مكافأة لسلة menu-images العامة عبر service_role. */
export async function uploadImageAction(formData: FormData): Promise<UploadImageResult> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "لم يتم اختيار ملف" };
  if (!file.type.startsWith("image/")) return { error: "الملف يجب أن يكون صورة" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت" };

  const folder = (formData.get("folder") as string | null) ?? "misc";
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.storage.from("menu-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: "تعذّر رفع الصورة" };

  const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
