-- عنوان الطابعة أصبح يُكتشف تلقائياً من منفذ USB على جهاز عامل الطباعة نفسه
-- (raspi/ميني بي سي)، بدل إدخاله يدوياً من صفحة إعدادات الطباعة بالكاشير.
alter table print_agent_status
  drop column if exists printer_interface;

notify pgrst, 'reload schema';
