"use server";

import crypto from "node:crypto";
import { AuthenticaError, sendOtp, verifyOtp } from "@brin/utils";
import { getSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

export type AuthActionResult = { error?: string };

export async function sendOtpAction(phone: string): Promise<AuthActionResult> {
  try {
    await sendOtp(phone);
    return {};
  } catch (error) {
    if (error instanceof AuthenticaError) return { error: error.message };
    return { error: "حدث خطأ غير متوقع أثناء إرسال الكود" };
  }
}

/** يتحقق مسبقاً هل رقم الجوال مسجّل لعميل موجود، عشان واجهة الدخول تقرر
 * تعرض حقل الاسم (تسجيل جديد) أو لا (تسجيل دخول لعميل موجود). */
export async function checkPhoneExistsAction(
  phone: string,
): Promise<{ exists: boolean; error?: string }> {
  const serviceRole = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRole
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (error) return { exists: false, error: "حدث خطأ غير متوقع" };
  return { exists: !!data };
}

export async function verifyOtpAction(
  phone: string,
  otp: string,
  fullName?: string,
): Promise<AuthActionResult> {
  try {
    await verifyOtp(phone, otp);
  } catch (error) {
    if (error instanceof AuthenticaError) return { error: error.message };
    return { error: "حدث خطأ غير متوقع أثناء التحقق من الكود" };
  }

  const serviceRole = createSupabaseServiceRoleClient();
  const randomPassword = crypto.randomBytes(32).toString("hex");

  const { data: existingCustomer } = await serviceRole
    .from("customers")
    .select("id, auth_user_id")
    .eq("phone", phone)
    .maybeSingle();

  let authUserId = existingCustomer?.auth_user_id ?? null;

  if (authUserId) {
    await serviceRole.auth.admin.updateUserById(authUserId, { password: randomPassword });
  } else {
    const { data: createdUser, error: createError } = await serviceRole.auth.admin.createUser({
      phone,
      phone_confirm: true,
      password: randomPassword,
    });
    if (createError || !createdUser.user) {
      console.error("[login] auth.admin.createUser failed:", createError);
      return { error: "تعذّر إنشاء الحساب" };
    }
    authUserId = createdUser.user.id;

    if (existingCustomer) {
      await serviceRole
        .from("customers")
        .update({ auth_user_id: authUserId })
        .eq("id", existingCustomer.id);
    } else {
      await serviceRole
        .from("customers")
        .insert({ phone, auth_user_id: authUserId, full_name: fullName?.trim() || null });
    }
  }

  const { data: signInData, error: signInError } = await serviceRole.auth.signInWithPassword({
    phone,
    password: randomPassword,
  });

  if (signInError || !signInData.session) {
    console.error("[login] auth.signInWithPassword failed:", signInError);
    return { error: "تعذّر تسجيل الدخول" };
  }

  const cookieBoundClient = await getSupabaseServerClient();
  await cookieBoundClient.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });

  return {};
}
