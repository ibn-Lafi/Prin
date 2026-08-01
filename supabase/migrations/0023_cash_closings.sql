-- الإقفال اليومي: كاش متوقع (من مجموع دفعات الكاش المسجّلة) مقابل كاش فعلي
-- (يُدخله المدير يدوياً بعد العدّ)، بفرق محسوب تلقائياً. سجل واحد لكل يوم.
create table cash_closings (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null unique,
  expected_cash numeric(10, 2) not null,
  actual_cash numeric(10, 2) not null,
  difference numeric(10, 2) generated always as (actual_cash - expected_cash) stored,
  closed_by_employee_id uuid references employees (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

alter table cash_closings enable row level security;
-- بدون سياسات anon/authenticated: بيانات مالية حساسة، تُدار حصراً من لوحة
-- الإدارة عبر service_role بعد التحقق من جلسة مدير.
