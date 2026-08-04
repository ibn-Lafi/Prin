-- استبدال فكرة "اقتراح عام دائم" (عمود is_cart_suggestion من 0040) بربط
-- سياقي: كل صنف "مُحفِّز" (مثل برجر) يُربط بصنف مقترح (مثل مشروب/صوص)،
-- ويظهر الاقتراح بالسلة فقط لو المُحفِّز فعلاً مضاف بالسلة حالياً.
alter table products drop column if exists is_cart_suggestion;

create table if not exists product_cart_suggestions (
  id uuid primary key default gen_random_uuid(),
  trigger_product_id uuid not null references products (id) on delete cascade,
  suggested_product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint product_cart_suggestions_not_self check (trigger_product_id <> suggested_product_id),
  constraint product_cart_suggestions_unique unique (trigger_product_id, suggested_product_id)
);

create index if not exists product_cart_suggestions_trigger_idx
  on product_cart_suggestions (trigger_product_id);

alter table product_cart_suggestions enable row level security;

drop policy if exists "product_cart_suggestions_public_read" on product_cart_suggestions;
create policy "product_cart_suggestions_public_read"
  on product_cart_suggestions for select
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
