import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "../env";

/**
 * عميل المتصفح — يُستخدم فقط بمكوّنات "use client" لموقع المنيو الإلكتروني.
 * جلسة العميل الحقيقية (بعد OTP عبر Authentica) تُدار من هنا عبر Supabase Auth.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
