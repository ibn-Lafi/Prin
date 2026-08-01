import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`متغير البيئة "${name}" مفقود — تأكد من ضبط print-agent/.env`);
  }
  return value;
}

// عناوين الطابعتين تُضبط الآن من لوحة الإدارة (restaurant_settings) وتُقرأ
// دورياً — راجع settingsSync.ts. متغيرات البيئة هنا احتياطية فقط، تُستخدم
// إلى حين أول قراءة ناجحة من قاعدة البيانات أو لو تُركت فارغة هناك.
export const config = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  kitchenPrinterInterfaceFallback: process.env.KITCHEN_PRINTER_INTERFACE ?? null,
  customerPrinterInterfaceFallback: process.env.CUSTOMER_PRINTER_INTERFACE ?? null,
};
