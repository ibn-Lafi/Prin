-- يدعم أكثر من صف بنفس الطلب لتقسيم الفاتورة (كاش + شبكة).
-- التحقق إن مجموع الدفعات = إجمالي الطلب بالضبط يتم بمرحلة 3 داخل
-- Server Action إنشاء الطلب (ضمن نفس المعاملة/Transaction)، مو بقيد قاعدة بيانات هنا.
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  method text not null check (method in ('cash', 'card_terminal', 'online_moyasar')),
  amount numeric(10, 2) not null check (amount > 0),
  status text not null default 'captured'
    check (status in ('pending', 'captured', 'refunded', 'failed')),
  moyasar_payment_id text,
  refunded_amount numeric(10, 2) not null default 0 check (refunded_amount >= 0),
  created_at timestamptz not null default now()
);

create index payments_order_id_idx on payments (order_id);

alter table payments enable row level security;

create policy "payments_customer_read_own"
  on payments for select
  to authenticated
  using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );
