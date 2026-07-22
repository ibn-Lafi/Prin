-- إعدادات عامة للمطعم — صف واحد فقط (Singleton)

create table restaurant_settings (
  id smallint primary key default 1,
  restaurant_name text not null default 'BRIN',
  vat_number text,
  tax_rate_percent numeric(5, 2) not null default 15.00,
  opening_time time not null default '09:00',
  closing_time time not null default '23:59',
  is_accepting_orders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_settings_singleton check (id = 1)
);

insert into restaurant_settings (id) values (1);

create trigger set_restaurant_settings_updated_at
  before update on restaurant_settings
  for each row
  execute function set_updated_at();

alter table restaurant_settings enable row level security;

-- إعدادات المطعم عامة وغير حساسة (تُعرض بالمنيو: ساعات العمل، الرقم الضريبي)
create policy "restaurant_settings_public_read"
  on restaurant_settings for select
  to anon, authenticated
  using (true);

-- لا توجد سياسة إدراج/تعديل/حذف لأي دور غير service_role (تُدار حصرياً من لوحة الإدارة عبر السيرفر)
