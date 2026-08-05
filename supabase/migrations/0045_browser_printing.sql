-- الطباعة صارت تشتغل مباشرة من متصفح الكاشير عبر WebUSB (بدون برنامج print-agent
-- منفصل يُثبَّت على أي جهاز، وبدون معرّف جهاز يُكتب يدوياً — يُولَّد تلقائياً
-- بالمتصفح ويُخزَّن محلياً). عمود print_jobs.station_id يبقى كما هو (نفس
-- الاستخدام والمعنى)، فقط مصدر قيمته صار توليداً تلقائياً بدل إدخال يدوي.

-- print_agent_status كان الغرض الوحيد منه تمكين عملية print-agent المنفصلة
-- (بدون localStorage) من معرفة فرعها وإرسال heartbeat/حالة اتصال — كلا الغرضين
-- أصبح محلياً بالكامل بمتصفح الكاشير (branchId مخزّن أصلاً بـ localStorage،
-- وحالة اتصال الطابعة تُقرأ مباشرة من أحداث navigator.usb). لا يوجد أي استخدام
-- متبقٍ له بأي مكان آخر بالنظام (تحقّق: لوحة الإدارة لا تعرض أي حالة أجهزة كاشير).
do $$
declare
  fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'print_jobs'::regclass
    and confrelid = 'print_agent_status'::regclass
    and contype = 'f';

  if fk_name is not null then
    execute format('alter table print_jobs drop constraint %I', fk_name);
  end if;
end $$;

drop table if exists print_agent_status;

-- جدول إشعارات خفيف لا يحمل أي بيانات حساسة (فقط "توجد مهمة طباعة جديدة
-- لهذا الفرع") — بديل منح anon قراءة مباشرة على print_jobs نفسه، الذي يحمل
-- أسماء/جوالات عملاء وأسعار طلبات كاملة (تسريب حقيقي لو مُنح لأي حامل لمفتاح
-- anon العام). يسمح لأي تبويب كاشير مفتوح بنفس الفرع بالاشتراك اللحظي ومعرفة
-- وصول مهمة طباعة جديدة (خصوصاً طلبات المنيو الإلكتروني التي لا يصاحبها أي
-- تبويب كاشير وقت إنشائها)، ثم جلب محتواها الفعلي عبر Server Action محمية
-- بجلسة موظف — نفس مبدأ orders_anon_read_pending_online (migration 0018).
create table print_job_notifications (
  id uuid primary key default gen_random_uuid(),
  print_job_id uuid not null references print_jobs (id) on delete cascade,
  branch_id uuid not null references branches (id),
  target text not null check (target in ('kitchen', 'customer')),
  created_at timestamptz not null default now()
);

create index print_job_notifications_branch_id_idx on print_job_notifications (branch_id);

alter table print_job_notifications enable row level security;

create policy "print_job_notifications_anon_read"
  on print_job_notifications for select
  to anon
  using (true);

alter publication supabase_realtime add table print_job_notifications;

notify pgrst, 'reload schema';
