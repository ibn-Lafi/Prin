create table combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_combos_updated_at
  before update on combos
  for each row
  execute function set_updated_at();

create table combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references combos (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  quantity int not null default 1 check (quantity > 0)
);

create index combo_items_combo_id_idx on combo_items (combo_id);
create index combo_items_product_id_idx on combo_items (product_id);

alter table combos enable row level security;
alter table combo_items enable row level security;

create policy "combos_public_read"
  on combos for select
  to anon, authenticated
  using (deleted_at is null and is_available = true);

create policy "combo_items_public_read"
  on combo_items for select
  to anon, authenticated
  using (true);
