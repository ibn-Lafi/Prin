-- auth_user_id فارغ (null) للعملاء اللي سجّلهم الموظف يدوياً بالكاشير بدون OTP.
-- يُملأ فقط لما العميل يسجّل دخول فعلياً بالمنيو الإلكتروني عبر Authentica OTP،
-- عندها RLS تستخدم auth.uid() = auth_user_id للوصول لبياناته الخاصة.

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name text,
  phone text not null unique,
  points_balance int not null default 0 check (points_balance >= 0),
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_auth_user_id_idx on customers (auth_user_id);

create trigger set_customers_updated_at
  before update on customers
  for each row
  execute function set_updated_at();

alter table customers enable row level security;

create policy "customers_read_own"
  on customers for select
  to authenticated
  using (auth.uid() = auth_user_id);

-- بدون سياسة INSERT/UPDATE للعميل عمداً: points_balance بنفس الصف، ولو سمحنا
-- بتعديل مباشر من العميل ما نقدر نمنعه من تعديل رصيد نقاطه بنفسه (RLS ما تقيّد
-- على مستوى العمود). أي تعديل ملف شخصي أو رصيد نقاط يمر إجبارياً عبر
-- Server Action بـ service_role.
