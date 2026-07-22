-- سجل حركات النقاط (Ledger) — كل اكتساب أو استبدال سطر مستقل، وقيمة
-- customers.points_balance تبقى مجرد رصيد مُخزّن (Cache) يُحدَّث تلقائياً هنا.
create table loyalty_points (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  points_change int not null check (points_change <> 0),
  reason text not null check (reason in ('order_earn', 'reward_redeem', 'manual_adjustment')),
  order_id uuid references orders (id) on delete set null,
  reward_id uuid references rewards (id) on delete set null,
  created_by_employee_id uuid references employees (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index loyalty_points_customer_id_idx on loyalty_points (customer_id);

-- customers.points_balance check (points_balance >= 0) هو من يمنع الرصيد السالب فعلياً؛
-- أي محاولة استبدال تتجاوز الرصيد المتاح تفشل مباشرة بخطأ من قاعدة البيانات.
create or replace function apply_loyalty_points_change()
returns trigger
language plpgsql
as $$
begin
  update customers
  set points_balance = points_balance + new.points_change
  where id = new.customer_id;

  return new;
end;
$$;

create trigger loyalty_points_after_insert_apply_balance
  after insert on loyalty_points
  for each row
  execute function apply_loyalty_points_change();

alter table loyalty_points enable row level security;

create policy "loyalty_points_customer_read_own"
  on loyalty_points for select
  to authenticated
  using (
    customer_id in (
      select id from customers where auth_user_id = auth.uid()
    )
  );

-- بدون سياسة إدراج للعميل: كل اكتساب/استبدال نقاط عملية حساسة تمر عبر
-- Server Action بـ service_role (فحص الرصيد، تسجيل الحركة، وتحديث الرصيد بمعاملة واحدة).
