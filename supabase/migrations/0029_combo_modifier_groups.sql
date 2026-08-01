-- يوسّع مجموعات التعديل (نوع الخبز، الإضافات، إزالة مكوّن...) لتشمل الوجبات
-- (combos) بجانب الأصناف (products) — بنفس نمط التمييز المستخدم أصلاً بجدول
-- order_items (عمود واحد مُعبّى من الاثنين عبر قيد XOR)، بدل تكرار الجداول.
alter table modifier_groups
  alter column product_id drop not null,
  add column combo_id uuid references combos (id) on delete cascade,
  add constraint modifier_groups_product_xor_combo check (num_nonnulls(product_id, combo_id) = 1);

create index modifier_groups_combo_id_idx on modifier_groups (combo_id);

-- يوسّع create_pos_order لحساب/تسجيل تعديلات الوجبات أيضاً (نفس منطق الأصناف
-- تماماً) — لا تغيير بتوقيع الدالة، فقط "create or replace" يكفي.
create or replace function create_pos_order(
  p_employee_id uuid,
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
  v_order_item_id uuid;
  v_modifier_id uuid;
  v_modifier_price numeric(10, 2);
  v_points int;
  v_daily_number int;
  v_order_date date;
  v_reward_points_cost int;
  v_reward_discount numeric(10, 2);
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

    select r.points_cost, r.discount_amount into v_reward_points_cost, v_reward_discount
    from rewards r
    where r.id = p_reward_id and r.is_active = true;

    if v_reward_points_cost is null then
      raise exception 'المكافأة غير متاحة';
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
    channel, subtotal, tax_amount, total, customer_id, employee_id,
    discount_amount, redeemed_reward_id, code_discount_amount, discount_code_id
  )
  values (
    'pos', v_subtotal, v_tax_amount, v_total, v_customer_id, p_employee_id,
    v_discount_amount, p_reward_id, v_code_discount_amount, v_code_id
  )
  returning id, orders.daily_order_number, orders.order_date into v_order_id, v_daily_number, v_order_date;

  -- تمريرة ثانية: إدراج الأصناف والتعديلات والدفعات فعلياً
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

  -- اكتساب النقاط: 1 ريال = 10 نقاط على الإجمالي الفعلي (بعد كل الخصومات)، فقط لو الطلب مربوط بعميل
  if v_customer_id is not null then
    v_points := floor(v_total * 10);
    if v_points > 0 then
      insert into loyalty_points (customer_id, points_change, reason, order_id)
      values (v_customer_id, v_points, 'order_earn', v_order_id);
    end if;
  end if;

  return query select v_order_id, v_daily_number, v_order_date, v_total, v_discount_amount, v_code_discount_amount;
end;
$$;
