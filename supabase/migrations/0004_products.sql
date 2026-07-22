create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete restrict,
  name text not null,
  description text,
  calories int check (calories is null or calories >= 0),
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on products (category_id);

create trigger set_products_updated_at
  before update on products
  for each row
  execute function set_updated_at();

alter table products enable row level security;

-- تختفي فوراً من المنيو عند نفاد المخزون (is_available = false) عبر Realtime،
-- لأن RLS تمنع وصول العميل للصف أساساً بمجرد ما يتغير الحقل
create policy "products_public_read"
  on products for select
  to anon, authenticated
  using (deleted_at is null and is_available = true);
