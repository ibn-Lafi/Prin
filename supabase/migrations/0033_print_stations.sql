-- يدعم عدة أجهزة كاشير فعلية، كل جهاز له طابعتاه الخاصتان — بدل إعداد واحد
-- مشترك تضبطه الإدارة لكل المطعم. "id" بجدول print_agent_status صار معرّف
-- نصي حر يختاره الكاشير لجهازه (بدل smallint ثابت بقيمة 1 دائماً)، يُدخله
-- الكاشير مرة وحدة بصفحة إعدادات الطباعة بنظام الكاشير، ونفس المعرّف يُضبط
-- بملف .env لعامل الطباعة (print-agent) المثبّت فعلياً على نفس الجهاز —
-- فيصير كل جهاز يربط طابعاته لحاله تلقائياً بمجرد إدخال هذا المعرّف مرة.
alter table print_agent_status drop constraint print_agent_status_singleton;
alter table print_agent_status alter column id drop default;
alter table print_agent_status alter column id type text using id::text;

alter table print_jobs
  add column station_id text references print_agent_status (id) on delete set null;

create index print_jobs_station_id_idx on print_jobs (station_id) where station_id is not null;
