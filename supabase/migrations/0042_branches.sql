-- نظام تعدد الفروع: كل فرع له اسم/عنوان/جوال وساعات عمل وتبديل قبول طلبات
-- إلكترونية خاصة فيه (بدل إعداد واحد عام بـ restaurant_settings) — الإدمن
-- يضيف/يعدّل الفروع من لوحة التحكم. القائمة (المنتجات/الفئات/الوجبات) تبقى
-- موحّدة وتُشارَك بين كل الفروع.
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  opening_time time not null default '09:00',
  closing_time time not null default '23:59',
  is_accepting_orders boolean not null default true,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_branches_updated_at') then
    create trigger set_branches_updated_at
      before update on branches
      for each row
      execute function set_updated_at();
  end if;
end $$;

alter table branches enable row level security;

drop policy if exists "branches_public_read" on branches;
create policy "branches_public_read"
  on branches for select
  to anon, authenticated
  using (is_active = true);

-- فرع افتراضي واحد حتى لا تنكسر البيانات الحالية (طلبات/محطات طباعة سابقة) —
-- الإدمن يقدر يعيد تسميته أو يضيف فروع إضافية بعدين من لوحة التحكم.
insert into branches (name)
select 'الفرع الرئيسي'
where not exists (select 1 from branches);

-- ===== orders: كل طلب ينتمي لفرع محدد، والترقيم اليومي يصير لكل فرع لحاله =====
alter table orders add column if not exists branch_id uuid references branches (id);

update orders set branch_id = (select id from branches order by created_at limit 1)
where branch_id is null;

alter table orders alter column branch_id set not null;
create index if not exists orders_branch_id_idx on orders (branch_id);

alter table orders drop constraint if exists orders_order_date_daily_order_number_key;
alter table orders add constraint orders_branch_date_number_unique unique (branch_id, order_date, daily_order_number);

alter table order_daily_counters add column if not exists branch_id uuid references branches (id);

update order_daily_counters set branch_id = (select id from branches order by created_at limit 1)
where branch_id is null;

alter table order_daily_counters alter column branch_id set not null;
alter table order_daily_counters drop constraint if exists order_daily_counters_pkey;
alter table order_daily_counters add primary key (branch_id, order_date);

create or replace function next_daily_order_number(p_branch_id uuid, p_date date)
returns int
language plpgsql
as $$
declare
  v_number int;
begin
  insert into order_daily_counters (branch_id, order_date, last_number)
  values (p_branch_id, p_date, 1)
  on conflict (branch_id, order_date)
  do update set last_number = order_daily_counters.last_number + 1
  returning last_number into v_number;

  return v_number;
end;
$$;

create or replace function orders_set_daily_number()
returns trigger
language plpgsql
as $$
begin
  new.order_date := (timezone('Asia/Riyadh', now()))::date;
  new.daily_order_number := next_daily_order_number(new.branch_id, new.order_date);
  return new;
end;
$$;

-- ===== print_jobs / print_agent_status: توجيه الطباعة يبقى داخل حدود الفرع =====
-- بدون هذا، طلب إلكتروني بفرع "أ" بدون جهاز محدد (station_id فارغ) ممكن
-- يُطبع بالغلط على طابعة فرع "ب" — أول عامل طباعة شغّال يحجزه بغض النظر عن الفرع.
alter table print_jobs add column if not exists branch_id uuid references branches (id);

update print_jobs pj set branch_id = o.branch_id
from orders o
where o.id = pj.order_id and pj.branch_id is null;

alter table print_jobs alter column branch_id set not null;
create index if not exists print_jobs_branch_id_idx on print_jobs (branch_id);

alter table print_agent_status add column if not exists branch_id uuid references branches (id) on delete set null;

-- ===== restaurant_settings: ساعات العمل وتبديل قبول الطلبات صارت خاصية كل فرع =====
alter table restaurant_settings drop column if exists opening_time;
alter table restaurant_settings drop column if exists closing_time;
alter table restaurant_settings drop column if exists is_accepting_orders;

-- ===== create_pos_order: يتطلب فرع الجهاز الآن =====
drop function if exists create_pos_order(uuid, text, text, jsonb, jsonb, uuid, text);

create or replace function create_pos_order(
  p_employee_id uuid,
  p_branch_id uuid,
  p_customer_phone text,
  p_customer_name text,
  p_items jsonb,
  p_payments jsonb,
  p_reward_id uuid default null,
  p_discount_code text default null
)
returns table (
  order_id uuid,
  daily_order_number int,
  order_date date,
  total numeric,
  discount_amount numeric,
  code_discount_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_subtotal numeric(10, 2) := 0;
  v_original_subtotal numeric(10, 2);
  v_tax_rate numeric(5, 2);
  v_tax_amount numeric(10, 2);
  v_total numeric(10, 2);
  v_paid numeric(10, 2) := 0;
  v_item jsonb;
  v_payment jsonb;
  v_kind text;
  v_ref_id uuid;
  v_quantity int;
  v_unit_price numeric(10, 2);
  v_points_per_unit int;
  v_order_item_id uuid;
  v_modifier_id uuid;
  v_modifier_price numeric(10, 2);
  v_points int := 0;
  v_daily_number int;
  v_order_date date;
  v_reward_points_cost int;
  v_reward_discount numeric(10, 2);
  v_reward_product_id uuid;
  v_reward_combo_id uuid;
  v_customer_points int;
  v_discount_amount numeric(10, 2) := 0;
  v_code_id uuid;
  v_code_discount_type text;
  v_code_value numeric(10, 2);
  v_code_min_order numeric(10, 2);
  v_code_valid_from timestamptz;
  v_code_valid_until timestamptz;
  v_code_max_uses int;
  v_code_times_used int;
  v_code_discount_amount numeric(10, 2) := 0;
begin
  if p_employee_id is null then
    raise exception 'employee_id مطلوب';
  end if;

  if not exists (select 1 from branches where id = p_branch_id and is_active = true) then
    raise exception 'فرع غير صالح — راجع إعدادات الجهاز';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'الطلب لازم يحتوي على صنف واحد على الأقل';
  end if;

  select tax_rate_percent into v_tax_rate from restaurant_settings where id = 1;

  -- عميل: إيجاد أو إنشاء عبر رقم الجوال (بدون OTP، اختياري بالكاشير)
  if p_customer_phone is not null and length(trim(p_customer_phone)) > 0 then
    select id into v_customer_id from customers where phone = p_customer_phone;
    if v_customer_id is null then
      insert into customers (phone, full_name)
      values (p_customer_phone, nullif(trim(coalesce(p_customer_name, '')), ''))
      returning id into v_customer_id;
    elsif p_customer_name is not null and length(trim(p_customer_name)) > 0 then
      update customers set full_name = p_customer_name where id = v_customer_id and full_name is null;
    end if;
  end if;

  -- تمريرة أولى: حساب المجموع الفرعي من الأسعار الحالية بقاعدة البيانات
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_kind := v_item ->> 'kind';
    v_ref_id := (v_item ->> 'refId')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'كمية غير صالحة';
    end if;

    if v_kind = 'product' then
      select price into v_unit_price from products where id = v_ref_id and deleted_at is null;
    elsif v_kind = 'combo' then
      select price into v_unit_price from combos where id = v_ref_id and deleted_at is null;
    else
      raise exception 'نوع صنف غير معروف: %', v_kind;
    end if;

    if v_unit_price is null then
      raise exception 'صنف غير موجود أو محذوف: %', v_ref_id;
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);

    if jsonb_typeof(v_item -> 'modifierIds') = 'array' then
      for v_modifier_id in select value::uuid from jsonb_array_elements_text(v_item -> 'modifierIds')
      loop
        select m.price_delta into v_modifier_price
        from modifiers m
        join modifier_groups mg on mg.id = m.modifier_group_id
        where m.id = v_modifier_id
          and ((v_kind = 'product' and mg.product_id = v_ref_id) or (v_kind = 'combo' and mg.combo_id = v_ref_id));

        if v_modifier_price is null then
          raise exception 'خيار تعديل غير صالح لهذا الصنف: %', v_modifier_id;
        end if;

        v_subtotal := v_subtotal + (v_modifier_price * v_quantity);
      end loop;
    end if;
  end loop;

  v_original_subtotal := v_subtotal;

  -- استبدال مكافأة (اختياري): يتطلب عميل مسجّل ورصيد نقاط كافٍ، ويخصم من
  -- المجموع الفرعي قبل حساب الضريبة (الضريبة على الصافي بعد الخصم).
  if p_reward_id is not null then
    if v_customer_id is null then
      raise exception 'استبدال المكافآت يتطلب عميل مسجّل (رقم جوال)';
    end if;

    select r.points_cost, r.discount_amount, r.product_id, r.combo_id
    into v_reward_points_cost, v_reward_discount, v_reward_product_id, v_reward_combo_id
    from rewards r
    where r.id = p_reward_id and r.is_active = true;

    if v_reward_points_cost is null then
      raise exception 'المكافأة غير متاحة';
    end if;

    -- مكافأة مربوطة بصنف/وجبة: الخصم = سعره الحالي (حي)، مو القيمة المخزّنة —
    -- يفشل لو الصنف صار غير متوفر أو محذوف بدل تطبيق خصم بقيمة قديمة/خاطئة.
    if v_reward_product_id is not null then
      select price into v_reward_discount
      from products
      where id = v_reward_product_id and deleted_at is null and is_available = true;

      if v_reward_discount is null then
        raise exception 'الصنف المرتبط بهذي المكافأة غير متاح حالياً';
      end if;
    elsif v_reward_combo_id is not null then
      select price into v_reward_discount
      from combos
      where id = v_reward_combo_id and deleted_at is null and is_available = true;

      if v_reward_discount is null then
        raise exception 'الوجبة المرتبطة بهذي المكافأة غير متاحة حالياً';
      end if;
    end if;

    select points_balance into v_customer_points from customers where id = v_customer_id;

    if v_customer_points < v_reward_points_cost then
      raise exception 'رصيد النقاط غير كافٍ لهذه المكافأة (المتاح: %، المطلوب: %)',
        v_customer_points, v_reward_points_cost;
    end if;

    v_discount_amount := least(v_reward_discount, v_subtotal);
    v_subtotal := v_subtotal - v_discount_amount;
  end if;

  -- كود خصم (اختياري): يُطبَّق على الناتج بعد خصم المكافأة (إن وُجد). قفل
  -- الصف (for update) يمنع تجاوز max_uses تحت تزامن حقيقي (كاشيرين بنفس اللحظة).
  if p_discount_code is not null and length(trim(p_discount_code)) > 0 then
    select dc.id, dc.discount_type, dc.value, dc.min_order_amount,
           dc.valid_from, dc.valid_until, dc.max_uses, dc.times_used
    into v_code_id, v_code_discount_type, v_code_value, v_code_min_order,
         v_code_valid_from, v_code_valid_until, v_code_max_uses, v_code_times_used
    from discount_codes dc
    where upper(dc.code) = upper(trim(p_discount_code)) and dc.is_active = true
    for update;

    if v_code_id is null then
      raise exception 'كود الخصم غير صالح';
    end if;

    if v_code_valid_from is not null and now() < v_code_valid_from then
      raise exception 'كود الخصم لم يبدأ بعد';
    end if;

    if v_code_valid_until is not null and now() > v_code_valid_until then
      raise exception 'انتهت صلاحية كود الخصم';
    end if;

    if v_code_max_uses is not null and v_code_times_used >= v_code_max_uses then
      raise exception 'تم الوصول للحد الأقصى لاستخدام هذا الكود';
    end if;

    if v_original_subtotal < v_code_min_order then
      raise exception 'الحد الأدنى لاستخدام هذا الكود % ريال', v_code_min_order;
    end if;

    if v_code_discount_type = 'percentage' then
      v_code_discount_amount := round(v_subtotal * v_code_value / 100, 2);
    else
      v_code_discount_amount := v_code_value;
    end if;

    v_code_discount_amount := least(v_code_discount_amount, v_subtotal);
    v_subtotal := v_subtotal - v_code_discount_amount;
  end if;

  v_tax_amount := round(v_subtotal * v_tax_rate / 100, 2);
  v_total := v_subtotal + v_tax_amount;

  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    v_paid := v_paid + (v_payment ->> 'amount')::numeric;
  end loop;

  if v_paid <> v_total then
    raise exception 'مجموع الدفعات (%) لا يساوي إجمالي الطلب (%)', v_paid, v_total;
  end if;

  insert into orders (
    branch_id, channel, subtotal, tax_amount, total, customer_id, employee_id,
    discount_amount, redeemed_reward_id, code_discount_amount, discount_code_id
  )
  values (
    p_branch_id, 'pos', v_subtotal, v_tax_amount, v_total, v_customer_id, p_employee_id,
    v_discount_amount, p_reward_id, v_code_discount_amount, v_code_id
  )
  returning id, orders.daily_order_number, orders.order_date into v_order_id, v_daily_number, v_order_date;

  -- تمريرة ثانية: إدراج الأصناف والتعديلات والدفعات فعلياً، وتجميع النقاط
  -- المكتسبة (points_per_unit × الكمية) لكل سطر.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_kind := v_item ->> 'kind';
    v_ref_id := (v_item ->> 'refId')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    if v_kind = 'product' then
      select price, points_per_unit into v_unit_price, v_points_per_unit from products where id = v_ref_id;
      insert into order_items (order_id, product_id, quantity, unit_price)
      values (v_order_id, v_ref_id, v_quantity, v_unit_price)
      returning id into v_order_item_id;
    else
      select price, points_per_unit into v_unit_price, v_points_per_unit from combos where id = v_ref_id;
      insert into order_items (order_id, combo_id, quantity, unit_price)
      values (v_order_id, v_ref_id, v_quantity, v_unit_price)
      returning id into v_order_item_id;
    end if;

    if v_customer_id is not null then
      v_points := v_points + (coalesce(v_points_per_unit, 0) * v_quantity);
    end if;

    if jsonb_typeof(v_item -> 'modifierIds') = 'array' then
      for v_modifier_id in select value::uuid from jsonb_array_elements_text(v_item -> 'modifierIds')
      loop
        select price_delta into v_modifier_price from modifiers where id = v_modifier_id;
        insert into order_item_modifiers (order_item_id, modifier_id, price_delta)
        values (v_order_item_id, v_modifier_id, v_modifier_price);
      end loop;
    end if;
  end loop;

  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    insert into payments (order_id, method, amount)
    values (v_order_id, v_payment ->> 'method', (v_payment ->> 'amount')::numeric);
  end loop;

  if p_reward_id is not null then
    insert into loyalty_points (customer_id, points_change, reason, order_id, reward_id, created_by_employee_id)
    values (v_customer_id, -v_reward_points_cost, 'reward_redeem', v_order_id, p_reward_id, p_employee_id);
  end if;

  if v_code_id is not null then
    update discount_codes set times_used = times_used + 1 where id = v_code_id;
  end if;

  if v_customer_id is not null and v_points > 0 then
    insert into loyalty_points (customer_id, points_change, reason, order_id)
    values (v_customer_id, v_points, 'order_earn', v_order_id);
  end if;

  return query select v_order_id, v_daily_number, v_order_date, v_total, v_discount_amount, v_code_discount_amount;
end;
$$;

-- ===== create_online_order: العميل يختار الفرع، وساعات العمل/قبول الطلبات تُقرأ من فرعه =====
drop function if exists create_online_order(uuid, jsonb, text, text, uuid);

create or replace function create_online_order(
  p_auth_user_id uuid,
  p_branch_id uuid,
  p_items jsonb,
  p_discount_code text default null,
  p_notes text default null,
  p_reward_id uuid default null
)
returns table (
  order_id uuid,
  daily_order_number int,
  order_date date,
  total numeric,
  discount_amount numeric,
  code_discount_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_subtotal numeric(10, 2) := 0;
  v_original_subtotal numeric(10, 2);
  v_tax_rate numeric(5, 2);
  v_is_accepting boolean;
  v_opening_time time;
  v_closing_time time;
  v_now_riyadh time;
  v_tax_amount numeric(10, 2);
  v_total numeric(10, 2);
  v_item jsonb;
  v_kind text;
  v_ref_id uuid;
  v_quantity int;
  v_unit_price numeric(10, 2);
  v_order_item_id uuid;
  v_modifier_id uuid;
  v_modifier_price numeric(10, 2);
  v_daily_number int;
  v_order_date date;
  v_code_id uuid;
  v_code_discount_type text;
  v_code_value numeric(10, 2);
  v_code_min_order numeric(10, 2);
  v_code_valid_from timestamptz;
  v_code_valid_until timestamptz;
  v_code_max_uses int;
  v_code_times_used int;
  v_code_discount_amount numeric(10, 2) := 0;
  v_reward_points_cost int;
  v_reward_discount numeric(10, 2);
  v_reward_product_id uuid;
  v_reward_combo_id uuid;
  v_customer_points int;
  v_discount_amount numeric(10, 2) := 0;
begin
  if p_auth_user_id is null then
    raise exception 'يجب تسجيل الدخول';
  end if;

  select id, points_balance into v_customer_id, v_customer_points from customers where auth_user_id = p_auth_user_id;
  if v_customer_id is null then
    raise exception 'حساب العميل غير موجود';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'الطلب لازم يحتوي على صنف واحد على الأقل';
  end if;

  select tax_rate_percent into v_tax_rate from restaurant_settings where id = 1;

  select is_accepting_orders, opening_time, closing_time
  into v_is_accepting, v_opening_time, v_closing_time
  from branches where id = p_branch_id and is_active = true;

  if v_opening_time is null then
    raise exception 'الفرع المختار غير متاح';
  end if;

  -- إعادة تحقق ساعات العمل/التبديل اليدوي لهذا الفرع على السيرفر — واجهة
  -- المنيو تتحقق منها أصلاً لعرض الرسالة المناسبة، لكن لا نثق بأي حالة
  -- وصلت من المتصفح لعملية تنشئ طلباً فعلياً (نفس مبدأ create_pos_order).
  if not coalesce(v_is_accepting, false) then
    raise exception 'هذا الفرع لا يستقبل طلبات إلكترونية حالياً';
  end if;

  v_now_riyadh := (now() at time zone 'Asia/Riyadh')::time;
  if v_opening_time <= v_closing_time then
    if not (v_now_riyadh >= v_opening_time and v_now_riyadh < v_closing_time) then
      raise exception 'هذا الفرع مغلق حالياً خارج ساعات العمل';
    end if;
  else
    if not (v_now_riyadh >= v_opening_time or v_now_riyadh < v_closing_time) then
      raise exception 'هذا الفرع مغلق حالياً خارج ساعات العمل';
    end if;
  end if;

  -- تمريرة أولى: حساب المجموع الفرعي من الأسعار الحالية بقاعدة البيانات
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_kind := v_item ->> 'kind';
    v_ref_id := (v_item ->> 'refId')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'كمية غير صالحة';
    end if;

    if v_kind = 'product' then
      select price into v_unit_price from products where id = v_ref_id and deleted_at is null and is_available = true;
    elsif v_kind = 'combo' then
      select price into v_unit_price from combos where id = v_ref_id and deleted_at is null and is_available = true;
    else
      raise exception 'نوع صنف غير معروف: %', v_kind;
    end if;

    if v_unit_price is null then
      raise exception 'صنف غير متاح حالياً: %', v_ref_id;
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);

    if jsonb_typeof(v_item -> 'modifierIds') = 'array' then
      for v_modifier_id in select value::uuid from jsonb_array_elements_text(v_item -> 'modifierIds')
      loop
        select m.price_delta into v_modifier_price
        from modifiers m
        join modifier_groups mg on mg.id = m.modifier_group_id
        where m.id = v_modifier_id
          and ((v_kind = 'product' and mg.product_id = v_ref_id) or (v_kind = 'combo' and mg.combo_id = v_ref_id));

        if v_modifier_price is null then
          raise exception 'خيار تعديل غير صالح لهذا الصنف: %', v_modifier_id;
        end if;

        v_subtotal := v_subtotal + (v_modifier_price * v_quantity);
      end loop;
    end if;
  end loop;

  v_original_subtotal := v_subtotal;

  -- استبدال مكافأة (اختياري) — نفس منطق create_pos_order بالضبط.
  if p_reward_id is not null then
    select r.points_cost, r.discount_amount, r.product_id, r.combo_id
    into v_reward_points_cost, v_reward_discount, v_reward_product_id, v_reward_combo_id
    from rewards r
    where r.id = p_reward_id and r.is_active = true;

    if v_reward_points_cost is null then
      raise exception 'المكافأة غير متاحة';
    end if;

    if v_reward_product_id is not null then
      select price into v_reward_discount
      from products
      where id = v_reward_product_id and deleted_at is null and is_available = true;

      if v_reward_discount is null then
        raise exception 'الصنف المرتبط بهذي المكافأة غير متاح حالياً';
      end if;
    elsif v_reward_combo_id is not null then
      select price into v_reward_discount
      from combos
      where id = v_reward_combo_id and deleted_at is null and is_available = true;

      if v_reward_discount is null then
        raise exception 'الوجبة المرتبطة بهذي المكافأة غير متاحة حالياً';
      end if;
    end if;

    if v_customer_points < v_reward_points_cost then
      raise exception 'رصيد النقاط غير كافٍ لهذه المكافأة (المتاح: %، المطلوب: %)',
        v_customer_points, v_reward_points_cost;
    end if;

    v_discount_amount := least(v_reward_discount, v_subtotal);
    v_subtotal := v_subtotal - v_discount_amount;
  end if;

  -- كود خصم (اختياري) — يُطبَّق على الناتج بعد خصم المكافأة (إن وُجدت).
  if p_discount_code is not null and length(trim(p_discount_code)) > 0 then
    select dc.id, dc.discount_type, dc.value, dc.min_order_amount,
           dc.valid_from, dc.valid_until, dc.max_uses, dc.times_used
    into v_code_id, v_code_discount_type, v_code_value, v_code_min_order,
         v_code_valid_from, v_code_valid_until, v_code_max_uses, v_code_times_used
    from discount_codes dc
    where upper(dc.code) = upper(trim(p_discount_code)) and dc.is_active = true
    for update;

    if v_code_id is null then
      raise exception 'كود الخصم غير صالح';
    end if;

    if v_code_valid_from is not null and now() < v_code_valid_from then
      raise exception 'كود الخصم لم يبدأ بعد';
    end if;

    if v_code_valid_until is not null and now() > v_code_valid_until then
      raise exception 'انتهت صلاحية كود الخصم';
    end if;

    if v_code_max_uses is not null and v_code_times_used >= v_code_max_uses then
      raise exception 'تم الوصول للحد الأقصى لاستخدام هذا الكود';
    end if;

    if v_original_subtotal < v_code_min_order then
      raise exception 'الحد الأدنى لاستخدام هذا الكود % ريال', v_code_min_order;
    end if;

    if v_code_discount_type = 'percentage' then
      v_code_discount_amount := round(v_subtotal * v_code_value / 100, 2);
    else
      v_code_discount_amount := v_code_value;
    end if;

    v_code_discount_amount := least(v_code_discount_amount, v_subtotal);
    v_subtotal := v_subtotal - v_code_discount_amount;
  end if;

  v_tax_amount := round(v_subtotal * v_tax_rate / 100, 2);
  v_total := v_subtotal + v_tax_amount;

  -- الطلب "accepted" فوراً — المطبخ يبدأ التحضير قبل ما العميل يوصل ويدفع.
  insert into orders (
    branch_id, channel, status, subtotal, tax_amount, total, customer_id,
    discount_amount, redeemed_reward_id, code_discount_amount, discount_code_id, notes
  )
  values (
    p_branch_id, 'online', 'accepted', v_subtotal, v_tax_amount, v_total, v_customer_id,
    v_discount_amount, p_reward_id, v_code_discount_amount, v_code_id, nullif(trim(p_notes), '')
  )
  returning id, orders.daily_order_number, orders.order_date into v_order_id, v_daily_number, v_order_date;

  -- تمريرة ثانية: إدراج الأصناف والتعديلات فعلياً (بدون دفعات — تُحصَّل لاحقاً)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_kind := v_item ->> 'kind';
    v_ref_id := (v_item ->> 'refId')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    if v_kind = 'product' then
      select price into v_unit_price from products where id = v_ref_id;
      insert into order_items (order_id, product_id, quantity, unit_price)
      values (v_order_id, v_ref_id, v_quantity, v_unit_price)
      returning id into v_order_item_id;
    else
      select price into v_unit_price from combos where id = v_ref_id;
      insert into order_items (order_id, combo_id, quantity, unit_price)
      values (v_order_id, v_ref_id, v_quantity, v_unit_price)
      returning id into v_order_item_id;
    end if;

    if jsonb_typeof(v_item -> 'modifierIds') = 'array' then
      for v_modifier_id in select value::uuid from jsonb_array_elements_text(v_item -> 'modifierIds')
      loop
        select price_delta into v_modifier_price from modifiers where id = v_modifier_id;
        insert into order_item_modifiers (order_item_id, modifier_id, price_delta)
        values (v_order_item_id, v_modifier_id, v_modifier_price);
      end loop;
    end if;
  end loop;

  if p_reward_id is not null then
    insert into loyalty_points (customer_id, points_change, reason, order_id, reward_id)
    values (v_customer_id, -v_reward_points_cost, 'reward_redeem', v_order_id, p_reward_id);
  end if;

  if v_code_id is not null then
    update discount_codes set times_used = times_used + 1 where id = v_code_id;
  end if;

  return query select v_order_id, v_daily_number, v_order_date, v_total, v_discount_amount, v_code_discount_amount;
end;
$$;

notify pgrst, 'reload schema';
