import { createSupabaseServiceRoleClient } from "@brin/database";

/**
 * الموظفون بدون Supabase Auth إطلاقاً — كل الوصول لقاعدة البيانات بموقع الكاشير
 * يمر عبر service_role بعد التحقق من جلسة الموظف المخصصة (lib/session.ts).
 */
export { createSupabaseServiceRoleClient };
