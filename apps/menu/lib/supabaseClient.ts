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
      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
      }
    },
  });
}

export { createSupabaseServiceRoleClient };
