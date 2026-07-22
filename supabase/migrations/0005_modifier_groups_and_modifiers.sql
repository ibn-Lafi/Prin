-- مجموعات التعديل (نوع الخبز، الإضافات...) لكل صنف
create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  is_required boolean not null default false,
  min_select int not null default 0 check (min_select >= 0),
  max_select int not null default 1 check (max_select >= 1),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint modifier_groups_min_max check (max_select >= min_select),
  constraint modifier_groups_required_min check (not is_required or min_select >= 1)
);

create index modifier_groups_product_id_idx on modifier_groups (product_id);

-- خيارات كل مجموعة (بدون كاتشب / +جبن ...)
create table modifiers (
  id uuid primary key default gen_random_uuid(),
  modifier_group_id uuid not null references modifier_groups (id) on delete cascade,
  name text not null,
  price_delta numeric(10, 2) not null default 0,
  is_available boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index modifiers_modifier_group_id_idx on modifiers (modifier_group_id);

alter table modifier_groups enable row level security;
alter table modifiers enable row level security;

create policy "modifier_groups_public_read"
  on modifier_groups for select
  to anon, authenticated
  using (true);

create policy "modifiers_public_read"
  on modifiers for select
  to anon, authenticated
  using (is_available = true);
