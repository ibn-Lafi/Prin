import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "../env";

/**
 * عميل service_role — يتجاوز RLS بالكامل. للاستخدام حصراً داخل
 * Server Actions / Route Handlers (أبداً بكود يصل للمتصفح).
 * هذا هو المسار الوحيد لعمليات الموظفين (بدون Supabase Auth) وكل عملية حساسة
 * (تأكيد دفع، خصم نقاط، إلغاء طلب).
 */
export function createSupabaseServiceRoleClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
