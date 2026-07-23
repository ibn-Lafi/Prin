-- بيانات وهمية إضافية لتجربة واجهة المنيو الجديدة (تبويبات متعددة + قائمة أصناف + مودال بخيارات).
-- آمن للتشغيل أكثر من مرة: كل إدخال يتجاهل نفسه إذا كان موجوداً بالفعل (لن يكرر البيانات).
-- شغّله في: Supabase Dashboard > SQL Editor > New query > الصق المحتوى بالكامل > Run.

-- 1) الأصناف (يضيف "مقبلات" و"حلويات" الجديدين، ويتأكد من وجود "برجر" و"مشروبات")
insert into categories (name, display_order)
select 'برجر', 1 where not exists (select 1 from categories where name = 'برجر');

insert into categories (name, display_order)
select 'مقبلات', 2 where not exists (select 1 from categories where name = 'مقبلات');

insert into categories (name, display_order)
select 'حلويات', 3 where not exists (select 1 from categories where name = 'حلويات');

insert into categories (name, display_order)
select 'مشروبات', 4 where not exists (select 1 from categories where name = 'مشروبات');

-- 2) منتجات جديدة في كل صنف
insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'برجر' limit 1),
       'برجر دبل تشيز', 'قطعتا لحم بقري، طبقتا جبن شيدر، بصل مكرمل', 820, 32.00
where not exists (select 1 from products where name = 'برجر دبل تشيز');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مقبلات' limit 1),
       'بطاطس مقلية', 'بطاطس مقرمشة مع صوص خاص', 320, 12.00
where not exists (select 1 from products where name = 'بطاطس مقلية');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مقبلات' limit 1),
       'حلقات بصل مقرمشة', null, 280, 14.00
where not exists (select 1 from products where name = 'حلقات بصل مقرمشة');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مقبلات' limit 1),
       'أجنحة دجاج حارة', 'أجنحة دجاج مقرمشة، اختر درجة الحرارة', 450, 18.00
where not exists (select 1 from products where name = 'أجنحة دجاج حارة');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'حلويات' limit 1),
       'كيك شوكولاتة لافا', 'كيك دافئ بحشوة شوكولاتة سائلة', 410, 15.00
where not exists (select 1 from products where name = 'كيك شوكولاتة لافا');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'حلويات' limit 1),
       'آيس كريم فانيليا', null, 250, 10.00
where not exists (select 1 from products where name = 'آيس كريم فانيليا');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مشروبات' limit 1),
       'عصير برتقال طازج', null, 120, 9.00
where not exists (select 1 from products where name = 'عصير برتقال طازج');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مشروبات' limit 1),
       'ماء معدني', null, 0, 3.00
where not exists (select 1 from products where name = 'ماء معدني');

-- 3) مجموعة تعديل اختيارية (حتى 4 اختيارات) على "برجر دبل تشيز"
insert into modifier_groups (product_id, name, is_required, min_select, max_select, display_order)
select p.id, 'إضافات', false, 0, 4, 1
from products p
where p.name = 'برجر دبل تشيز'
  and not exists (
    select 1 from modifier_groups mg where mg.product_id = p.id and mg.name = 'إضافات'
  );

insert into modifiers (modifier_group_id, name, price_delta, display_order)
select mg.id, v.name, v.price_delta, v.display_order
from modifier_groups mg
join (values
  ('جبن إضافي', 4.00, 1),
  ('بيكون مقرمش', 6.00, 2),
  ('بصل مكرمل', 3.00, 3),
  ('صلصة حارة', 0.00, 4)
) as v(name, price_delta, display_order) on true
join products p on p.id = mg.product_id
where p.name = 'برجر دبل تشيز' and mg.name = 'إضافات'
  and not exists (
    select 1 from modifiers m where m.modifier_group_id = mg.id and m.name = v.name
  );

-- 4) مجموعة تعديل إجبارية (درجة الحرارة) على "أجنحة دجاج حارة"
insert into modifier_groups (product_id, name, is_required, min_select, max_select, display_order)
select p.id, 'درجة الحرارة', true, 1, 1, 1
from products p
where p.name = 'أجنحة دجاج حارة'
  and not exists (
    select 1 from modifier_groups mg where mg.product_id = p.id and mg.name = 'درجة الحرارة'
  );

insert into modifiers (modifier_group_id, name, price_delta, display_order)
select mg.id, v.name, v.price_delta, v.display_order
from modifier_groups mg
join (values
  ('عادي', 0.00, 1),
  ('حار', 0.00, 2),
  ('حار جداً', 0.00, 3)
) as v(name, price_delta, display_order) on true
join products p on p.id = mg.product_id
where p.name = 'أجنحة دجاج حارة' and mg.name = 'درجة الحرارة'
  and not exists (
    select 1 from modifiers m where m.modifier_group_id = mg.id and m.name = v.name
  );

-- 5) وجبة (Combo) جديدة
insert into combos (name, description, price)
select 'وجبة دبل تشيز', 'برجر دبل تشيز + بطاطس مقلية + عصير برتقال', 48.00
where not exists (select 1 from combos where name = 'وجبة دبل تشيز');

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1
from combos c
join products p on p.name = 'برجر دبل تشيز'
where c.name = 'وجبة دبل تشيز'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1
from combos c
join products p on p.name = 'بطاطس مقلية'
where c.name = 'وجبة دبل تشيز'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1
from combos c
join products p on p.name = 'عصير برتقال طازج'
where c.name = 'وجبة دبل تشيز'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

-- 6) مكافأة إضافية
insert into rewards (name, description, points_cost)
select 'وجبة دبل تشيز مجانية', 'استبدل نقاطك بوجبة دبل تشيز كاملة', 1200
where not exists (select 1 from rewards where name = 'وجبة دبل تشيز مجانية');
