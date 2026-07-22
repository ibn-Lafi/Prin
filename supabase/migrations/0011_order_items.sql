create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete restrict,
  combo_id uuid references combos (id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  constraint order_items_product_xor_combo check (num_nonnulls(product_id, combo_id) = 1)
);

create index order_items_order_id_idx on order_items (order_id);
create index order_items_product_id_idx on order_items (product_id);

-- التعديلات المختارة فعلياً لكل صنف بالطلب (نسخة سعر وقت الطلب، مو سعر الصنف الحالي)
create table order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items (id) on delete cascade,
  modifier_id uuid not null references modifiers (id) on delete restrict,
  price_delta numeric(10, 2) not null default 0
);

create index order_item_modifiers_order_item_id_idx on order_item_modifiers (order_item_id);

alter table order_items enable row level security;
alter table order_item_modifiers enable row level security;

create policy "order_items_customer_read_own"
  on order_items for select
  to authenticated
  using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

create policy "order_item_modifiers_customer_read_own"
  on order_item_modifiers for select
  to authenticated
  using (
    order_item_id in (
      select oi.id from order_items oi
      join orders o on o.id = oi.order_id
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );
