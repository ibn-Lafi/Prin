-- تصحيح افتراض النظام: طابعة فعلية واحدة فقط عند كل جهاز كاشير — تطبع
-- فاتورتين متتاليتين على نفس الجهاز (فاتورة مطبخ مختصرة، ثم فاتورة عميل
-- كاملة بالتفاصيل)، مو طابعتين منفصلتين لكل جهاز كما كان مفترضاً سابقاً
-- بأعمدة kitchen_printer_*/customer_printer_* المنفصلة. عمود print_jobs.target
-- ('kitchen'/'customer') يبقى كما هو — يمثّل صيغة الفاتورة (شكل المحتوى)
-- لا هوية طابعة فعلية، وهذا صحيح أصلاً مع الطابعة الواحدة.
alter table print_agent_status
  add column if not exists printer_interface text,
  add column if not exists printer_connected boolean not null default false;

-- بـ DO block عشان الملف يبقى آمناً لإعادة التشغيل حتى بعد ما تُحذف الأعمدة
-- القديمة بأسفل هذا الملف (لو أعيد تشغيله كاملاً بالغلط مرة ثانية).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'print_agent_status' and column_name = 'kitchen_printer_interface'
  ) then
    update print_agent_status
    set
      printer_interface = coalesce(printer_interface, kitchen_printer_interface, customer_printer_interface),
      printer_connected = coalesce(printer_connected, false)
        or coalesce(kitchen_printer_connected, false)
        or coalesce(customer_printer_connected, false);
  end if;
end $$;

alter table print_agent_status
  drop column if exists kitchen_printer_interface,
  drop column if exists customer_printer_interface,
  drop column if exists kitchen_printer_connected,
  drop column if exists customer_printer_connected;
