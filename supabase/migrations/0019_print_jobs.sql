-- المرحلة 4: الطباعة — طابور مهام طباعة يعالجه Print Agent محلي (جهاز الكاشير)
-- عبر service_role (مثله مثل أي عملية خلفية موثوقة)، بدون أي كشف RLS لـ anon/authenticated.

create table print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  target text not null check (target in ('kitchen', 'customer')),
  status text not null default 'pending' check (status in ('pending', 'printed', 'failed')),
  payload jsonb not null,
  attempts int not null default 0,
  error_message text,
  printed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index print_jobs_order_id_idx on print_jobs (order_id);
create index print_jobs_status_idx on print_jobs (status);

create trigger set_print_jobs_updated_at
  before update on print_jobs
  for each row
  execute function set_updated_at();

alter table print_jobs enable row level security;
-- بدون أي سياسة لـ anon/authenticated: POS ينشئ المهام و Print Agent يقرأها/يحدّثها
-- كلاهما عبر service_role (السماح لـ anon بقراءتها يكشف أسماء/جوالات عملاء وأسعار
-- كل الطلبات، على عكس نافذة orders الضيقة جداً بـ migration 0018).

alter publication supabase_realtime add table print_jobs;

-- حالة جهاز الطباعة المحلي (نبض حياة + اتصال الطابعتين) — بيانات غير حساسة إطلاقاً،
-- لكن نتركها service_role فقط بالتناسق، وتُعرض بالكاشير عبر Server Action مستطلَع (polling)
-- بدل RLS/Realtime، لأن التنبيه لا يحتاج فورية تحت الثانية.
create table print_agent_status (
  id smallint primary key default 1,
  last_heartbeat_at timestamptz,
  kitchen_printer_connected boolean not null default false,
  customer_printer_connected boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint print_agent_status_singleton check (id = 1)
);

insert into print_agent_status (id) values (1);

create trigger set_print_agent_status_updated_at
  before update on print_agent_status
  for each row
  execute function set_updated_at();

alter table print_agent_status enable row level security;
