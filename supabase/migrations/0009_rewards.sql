create table rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_cost int not null check (points_cost > 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_rewards_updated_at
  before update on rewards
  for each row
  execute function set_updated_at();

alter table rewards enable row level security;

create policy "rewards_public_read"
  on rewards for select
  to anon, authenticated
  using (is_active = true);
