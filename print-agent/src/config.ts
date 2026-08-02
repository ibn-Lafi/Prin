import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`متغير البيئة "${name}" مفقود — تأكد من ضبط print-agent/.env`);
  }
  return value;
}

// عناوين الطابعتين تُضبطان الآن من نظام الكاشير (صفحة إعدادات الطباعة)، لكل
// جهاز كاشير على حدة — تُقرأ دورياً حسب STATION_ID (راجع settingsSync.ts).
// STATION_ID لازم يطابق بالضبط المعرّف اللي يدخله الكاشير بصفحة إعدادات
// الطباعة على نفس الجهاز فعلياً — بدونه ما نعرف أي صف بجدول
// print_agent_status يخص هذا التثبيت. متغيرات الطابعة هنا احتياطية فقط،
// تُستخدم إلى حين أول قراءة ناجحة من قاعدة البيانات أو لو تُركت فارغة هناك.
export const config = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  stationId: required("STATION_ID"),
  kitchenPrinterInterfaceFallback: process.env.KITCHEN_PRINTER_INTERFACE ?? null,
  customerPrinterInterfaceFallback: process.env.CUSTOMER_PRINTER_INTERFACE ?? null,
};
