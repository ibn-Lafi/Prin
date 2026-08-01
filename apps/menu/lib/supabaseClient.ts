import { cookies } from "next/headers";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@brin/database";

/**
 * عميل مربوط بكوكيز الطلب الحالي — لقراءة/تحديث جلسة العميل داخل
 * Server Components و Server Actions و Route Handlers بموقع المنيو.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // setAll استُدعيت أثناء Server Component (مو Server Action/Route Handler) —
        // Next.js يمنع تعديل الكوكيز هناك. تجاهلها آمن هنا لأن الجلسة تُقرأ
        // بنجاح بأي حال؛ فقط تجديد التوكن التلقائي يتأجل لأقرب Server Action.
        // بدون try/catch هذا الخطأ يطلع كـ unhandledRejection ويسقّط السيرفر كامل.
      }
    },
  });
}

export { createSupabaseServiceRoleClient };
