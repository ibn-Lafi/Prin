-- عدّاد منفصل لكل يوم عمل (بتوقيت الرياض) يضمن رقم طلب يومي يتصفّر كل يوم
-- بدون تصادم تحت التزامن (upsert ذرّي بدل MAX() اللي يتعرض لسباق).
create table order_daily_counters (
  order_date date primary key,
  last_number int not null default 0
);

alter table order_daily_counters enable row level security;

create or replace function next_daily_order_number(p_date date)
returns int
language plpgsql
as $$
declare
  v_number int;
begin
  insert into order_daily_counters (order_date, last_number)
  values (p_date, 1)
  on conflict (order_date)
  do update set last_number = order_daily_counters.last_number + 1
  returning last_number into v_number;

  return v_number;
end;
$$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_date date not null,
  daily_order_number int not null,
  channel text not null check (channel in ('pos', 'online')),
  status text not null default 'received'
    check (status in ('pending_payment', 'received', 'accepted', 'cancelled')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  tax_amount numeric(10, 2) not null check (tax_amount >= 0),
  total numeric(10, 2) not null check (total >= 0),
  customer_id uuid references customers (id) on delete set null,
  employee_id uuid references employees (id) on delete set null,
  cancelled_by_employee_id uuid references employees (id) on delete set null,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_date, daily_order_number)
);

create index orders_customer_id_idx on orders (customer_id);
create index orders_employee_id_idx on orders (employee_id);
create index orders_status_idx on orders (status);
create index orders_order_date_idx on orders (order_date);

create trigger set_orders_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

create or replace function orders_set_daily_number()
returns trigger
language plpgsql
as $$
begin
  new.order_date := (timezone('Asia/Riyadh', now()))::date;
  new.daily_order_number := next_daily_order_number(new.order_date);
  return new;
end;
$$;

create trigger orders_before_insert_set_daily_number
  before insert on orders
  for each row
  execute function orders_set_daily_number();

alter table orders enable row level security;

-- العميل يشوف طلباته الخاصة فقط (سجل الطلبات بصفحة حسابه بالمنيو)
create policy "orders_customer_read_own"
  on orders for select
  to authenticated
  using (
    customer_id in (
      select id from customers where auth_user_id = auth.uid()
    )
  );

-- بدون سياسات إدراج/تعديل لأي دور غير service_role: إنشاء الطلب وتغيير حالته
-- عملية حساسة (تسعير، مخزون، دفع) تمر حصراً عبر Server Actions.
