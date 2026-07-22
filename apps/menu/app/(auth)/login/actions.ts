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

export async function verifyOtpAction(phone: string, otp: string): Promise<AuthActionResult> {
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
      return { error: "تعذّر إنشاء الحساب" };
    }
    authUserId = createdUser.user.id;

    if (existingCustomer) {
      await serviceRole
        .from("customers")
        .update({ auth_user_id: authUserId })
        .eq("id", existingCustomer.id);
    } else {
      await serviceRole.from("customers").insert({ phone, auth_user_id: authUserId });
    }
  }

  const { data: signInData, error: signInError } = await serviceRole.auth.signInWithPassword({
    phone,
    password: randomPassword,
  });

  if (signInError || !signInData.session) {
    return { error: "تعذّر تسجيل الدخول" };
  }

  const cookieBoundClient = await getSupabaseServerClient();
  await cookieBoundClient.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });

  return {};
}
