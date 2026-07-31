import { createSupabaseServiceRoleClient } from "@brin/database";

/**
 * المدير بدون Supabase Auth إطلاقاً — كل الوصول لقاعدة البيانات بلوحة الإدارة
 * يمر عبر service_role بعد التحقق من جلسة المدير المخصصة (lib/session.ts).
 */
export { createSupabaseServiceRoleClient };
