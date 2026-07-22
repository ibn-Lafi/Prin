import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { Database } from "../types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "../env";

/**
 * عميل السيرفر (SSR) — لقراءة/تحديث جلسة العميل داخل Server Components و
 * Route Handlers بموقع المنيو، عبر محوّل كوكيز يمرره التطبيق (next/headers).
 * غير مخصص لعمليات الموظفين — هذي تمر عبر createSupabaseServiceRoleClient.
 */
export function createSupabaseServerClient(cookieMethods: CookieMethodsServer) {
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: cookieMethods,
  });
}
