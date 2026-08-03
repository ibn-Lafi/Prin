-- ملاحظة اختيارية يكتبها العميل عند الطلب من المنيو الإلكتروني (مثلاً:
-- "بدون بصل"، "اطرقوا الباب بدل الجرس") — تظهر للكاشير عند وصول الطلب
-- وتُطبع بفاتورة المطبخ. حقل واحد على مستوى الطلب كامل، وليس لكل صنف
-- (order_items.notes موجود مسبقاً لكن غير مستخدم حالياً بأي مسار).
alter table orders add column if not exists notes text;

drop function if exists create_online_order(uuid, jsonb, text);

create or replace function create_online_order(
  p_auth_user_id uuid,
  p_items jsonb,
  p_discount_code text default null,
  p_notes text default null
)
returns table (
  order_id uuid,
  daily_order_number int,
  order_date date,
  total numeric,
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
begin
  if p_auth_user_id is null then
    raise exception 'يجب تسجيل الدخول';
  end if;

  select id into v_customer_id from customers where auth_user_id = p_auth_user_id;
  if v_customer_id is null then
    raise exception 'حساب العميل غير موجود';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'الطلب لازم يحتوي على صنف واحد على الأقل';
  end if;

  select tax_rate_percent, is_accepting_orders, opening_time, closing_time
  into v_tax_rate, v_is_accepting, v_opening_time, v_closing_time
  from restaurant_settings where id = 1;

  -- إعادة تحقق ساعات العمل/التبديل اليدوي على السيرفر — واجهة المنيو تتحقق
  -- منها أصلاً لعرض الرسالة المناسبة، لكن لا نثق بأي حالة وصلت من المتصفح
  -- لعملية تنشئ طلباً فعلياً (نفس مبدأ create_pos_order).
  if not coalesce(v_is_accepting, false) then
    raise exception 'المطعم لا يستقبل طلبات إلكترونية حالياً';
  end if;

  v_now_riyadh := (now() at time zone 'Asia/Riyadh')::time;
  if v_opening_time <= v_closing_time then
    if not (v_now_riyadh >= v_opening_time and v_now_riyadh < v_closing_time) then
      raise exception 'المطعم مغلق حالياً خارج ساعات العمل';
    end if;
  else
    if not (v_now_riyadh >= v_opening_time or v_now_riyadh < v_closing_time) then
      raise exception 'المطعم مغلق حالياً خارج ساعات العمل';
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

  -- كود خصم (اختياري) — نفس منطق create_pos_order بالضبط.
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
  -- accepted_by_employee_id/accepted_at يُضبطان لاحقاً وقت تحصيل الدفع فعلياً
  -- (راجع collect_online_order_payment) — يمثّلان هنا "مين حصّل الدفع ومتى"
  -- بدل "مين قبِل الطلب"، عشان تقارير الجلسة المالية تنسب المبلغ للكاشير الصحيح.
  insert into orders (
    channel, status, subtotal, tax_amount, total, customer_id,
    code_discount_amount, discount_code_id, notes
  )
  values (
    'online', 'accepted', v_subtotal, v_tax_amount, v_total, v_customer_id,
    v_code_discount_amount, v_code_id, nullif(trim(p_notes), '')
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

  if v_code_id is not null then
    update discount_codes set times_used = times_used + 1 where id = v_code_id;
  end if;

  return query select v_order_id, v_daily_number, v_order_date, v_total, v_code_discount_amount;
end;
$$;
