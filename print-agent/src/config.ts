import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`متغير البيئة "${name}" مفقود — تأكد من ضبط print-agent/.env`);
  }
  return value;
}

// عنوان الطابعة يُضبط الآن من نظام الكاشير (صفحة إعدادات الطباعة)، لكل جهاز
// كاشير على حدة — يُقرأ دورياً حسب STATION_ID (راجع settingsSync.ts). طابعة
// واحدة فعلية فقط لكل جهاز كاشير — تطبع فاتورتي المطبخ والعميل تباعاً (كل
// واحدة تُقص لوحدها)، وليست طابعتين منفصلتين. STATION_ID لازم يطابق بالضبط
// المعرّف اللي يدخله الكاشير بصفحة إعدادات الطباعة على نفس الجهاز فعلياً —
// بدونه ما نعرف أي صف بجدول print_agent_status يخص هذا التثبيت. متغير
// الطابعة هنا احتياطي فقط، يُستخدم إلى حين أول قراءة ناجحة من قاعدة
// البيانات أو لو تُرك فارغاً هناك.
export const config = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  stationId: required("STATION_ID"),
  printerInterfaceFallback: process.env.PRINTER_INTERFACE ?? null,
};
