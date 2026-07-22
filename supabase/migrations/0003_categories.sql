create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_display_order_idx on categories (display_order);

create trigger set_categories_updated_at
  before update on categories
  for each row
  execute function set_updated_at();

alter table categories enable row level security;

create policy "categories_public_read"
  on categories for select
  to anon, authenticated
  using (deleted_at is null and is_active = true);
