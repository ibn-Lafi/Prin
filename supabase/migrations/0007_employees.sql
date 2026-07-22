-- الموظفون يدخلون بكود PIN فقط (بدون Supabase Auth) — جلسة مخصصة تُدار بالتطبيق.
-- ولذلك RLS هنا بدون أي سياسة لـ anon/authenticated: الوصول حصراً عبر service_role
-- من داخل Server Actions/Route Handlers بعد التحقق من الجلسة المخصصة.

create table employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  pin_hash text not null,
  role text not null check (role in ('manager', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_employees_updated_at
  before update on employees
  for each row
  execute function set_updated_at();

alter table employees enable row level security;
