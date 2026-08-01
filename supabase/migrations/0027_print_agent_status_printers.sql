-- عناوين الطابعتين تُضبط الآن من لوحة الإدارة وتُقرأ دورياً من Print Agent
-- بدل ملف .env يدوي على جهاز الكاشير (راجع print-agent/src/settingsSync.ts).
--
-- تُخزَّن بجدول print_agent_status (بدون أي سياسة anon/authenticated، service_role
-- فقط) لا restaurant_settings — لأن الأخير له سياسة قراءة عامة (using (true))
-- يعتمد عليها المنيو الإلكتروني لعرض ساعات العمل ونسبة الضريبة. RLS بـ Postgres
-- على مستوى الصف لا العمود، فأي عمود يُضاف لجدول عام يصير قابلاً للقراءة عبر
-- REST مباشرة (?select=kitchen_printer_interface) بغض النظر عن كونه "غير مستخدم"
-- بواجهة المنيو — عناوين شبكة داخلية للطابعات لا يصح تسريبها هكذا.
alter table print_agent_status
  add column kitchen_printer_interface text,
  add column customer_printer_interface text;
