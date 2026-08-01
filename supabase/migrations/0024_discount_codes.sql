-- أكواد الخصم / العروض المحدودة بوقت — إدارة (لوحة الإدارة) هذي المرحلة فقط.
-- الربط الفعلي بإنشاء الطلب (تطبيق الكود وقت الدفع بالكاشير/المنيو) خطوة
-- لاحقة منفصلة، بنفس مبدأ استبدال المكافآت (لا نثق بأي حساب من المتصفح).
create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_order_amount numeric(10, 2) not null default 0 check (min_order_amount >= 0),
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  times_used int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_percentage_range
    check (discount_type <> 'percentage' or value <= 100),
  constraint discount_codes_validity_window
    check (valid_from is null or valid_until is null or valid_until >= valid_from)
);

create index discount_codes_code_idx on discount_codes (upper(code));

create trigger set_discount_codes_updated_at
  before update on discount_codes
  for each row
  execute function set_updated_at();

alter table discount_codes enable row level security;
-- بدون سياسات anon/authenticated: تُدار حصراً من لوحة الإدارة، والتحقق من صحة
-- الكود وقت الاستخدام (لاحقاً) يمر عبر RPC بـ service_role مثل create_pos_order.
