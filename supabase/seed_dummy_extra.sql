-- بيانات وهمية للتجربة فقط — منتجات قابلة للحذف لاحقاً عبر seed_dummy_extra_cleanup.sql
-- التنظيم: برجر (بخيارات إضافة/حذف مكونات) — اضافات (صوصات وبطاطس) — مشروبات — وجبات (Combos).
-- آمن للتشغيل أكثر من مرة: كل إدخال يتجاهل نفسه إذا كان موجوداً بالفعل.
-- شغّله في: Supabase Dashboard > SQL Editor > New query > الصق المحتوى بالكامل > Run.

-- 1) الأصناف
insert into categories (name, display_order)
select 'برجر', 1 where not exists (select 1 from categories where name = 'برجر');

insert into categories (name, display_order)
select 'اضافات', 2 where not exists (select 1 from categories where name = 'اضافات');

insert into categories (name, display_order)
select 'مشروبات', 3 where not exists (select 1 from categories where name = 'مشروبات');

-- 2) منتجات البرجر
insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'برجر' limit 1),
       'برجر لحم كلاسيك', 'لحم بقري، جبن، خس، طماطم', 650, 25.00
where not exists (select 1 from products where name = 'برجر لحم كلاسيك');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'برجر' limit 1),
       'برجر دجاج مقرمش', 'صدر دجاج مقرمش، مايونيز، خس', 580, 22.00
where not exists (select 1 from products where name = 'برجر دجاج مقرمش');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'برجر' limit 1),
       'برجر دبل تشيز', 'قطعتا لحم بقري، طبقتا جبن شيدر', 820, 32.00
where not exists (select 1 from products where name = 'برجر دبل تشيز');

-- 3) منتجات الإضافات (صوصات وبطاطس)
insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'اضافات' limit 1),
       'بطاطس مقلية', 'بطاطس مقرمشة', 320, 12.00
where not exists (select 1 from products where name = 'بطاطس مقلية');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'اضافات' limit 1),
       'بطاطس بالجبن والصلصة', null, 380, 16.00
where not exists (select 1 from products where name = 'بطاطس بالجبن والصلصة');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'اضافات' limit 1),
       'صوص باربكيو', null, 40, 3.00
where not exists (select 1 from products where name = 'صوص باربكيو');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'اضافات' limit 1),
       'صوص رانش', null, 50, 3.00
where not exists (select 1 from products where name = 'صوص رانش');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'اضافات' limit 1),
       'صوص ثوم', null, 45, 3.00
where not exists (select 1 from products where name = 'صوص ثوم');

-- 4) المشروبات
insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مشروبات' limit 1),
       'بيبسي', null, 140, 6.00
where not exists (select 1 from products where name = 'بيبسي');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مشروبات' limit 1),
       'سفن أب', null, 140, 6.00
where not exists (select 1 from products where name = 'سفن أب');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مشروبات' limit 1),
       'عصير برتقال طازج', null, 120, 9.00
where not exists (select 1 from products where name = 'عصير برتقال طازج');

insert into products (category_id, name, description, calories, price)
select (select id from categories where name = 'مشروبات' limit 1),
       'ماء معدني', null, 0, 3.00
where not exists (select 1 from products where name = 'ماء معدني');

-- 5) خيارات إضافة/حذف المكونات لكل برجر
-- 5.1) برجر لحم كلاسيك: نوع الخبز (إجباري) + أضف أو احذف مكونات (اختياري)
insert into modifier_groups (product_id, name, is_required, min_select, max_select, display_order)
select p.id, 'نوع الخبز', true, 1, 1, 1
from products p
where p.name = 'برجر لحم كلاسيك'
  and not exists (select 1 from modifier_groups mg where mg.product_id = p.id and mg.name = 'نوع الخبز');

insert into modifiers (modifier_group_id, name, price_delta, display_order)
select mg.id, v.name, v.price_delta, v.display_order
from modifier_groups mg
join products p on p.id = mg.product_id
join (values ('خبز عادي', 0.00, 1), ('خبز بريوش', 3.00, 2)) as v(name, price_delta, display_order) on true
where p.name = 'برجر لحم كلاسيك' and mg.name = 'نوع الخبز'
  and not exists (select 1 from modifiers m where m.modifier_group_id = mg.id and m.name = v.name);

insert into modifier_groups (product_id, name, is_required, min_select, max_select, display_order)
select p.id, 'أضف أو احذف مكونات', false, 0, 6, 2
from products p
where p.name = 'برجر لحم كلاسيك'
  and not exists (select 1 from modifier_groups mg where mg.product_id = p.id and mg.name = 'أضف أو احذف مكونات');

insert into modifiers (modifier_group_id, name, price_delta, display_order)
select mg.id, v.name, v.price_delta, v.display_order
from modifier_groups mg
join products p on p.id = mg.product_id
join (values
  ('بدون خس', 0.00, 1),
  ('بدون طماطم', 0.00, 2),
  ('بدون بصل', 0.00, 3),
  ('جبن إضافي', 4.00, 4),
  ('بيكون', 6.00, 5),
  ('مايونيز إضافي', 2.00, 6)
) as v(name, price_delta, display_order) on true
where p.name = 'برجر لحم كلاسيك' and mg.name = 'أضف أو احذف مكونات'
  and not exists (select 1 from modifiers m where m.modifier_group_id = mg.id and m.name = v.name);

-- 5.2) برجر دجاج مقرمش: نوع الخبز (إجباري) + أضف أو احذف مكونات (اختياري)
insert into modifier_groups (product_id, name, is_required, min_select, max_select, display_order)
select p.id, 'نوع الخبز', true, 1, 1, 1
from products p
where p.name = 'برجر دجاج مقرمش'
  and not exists (select 1 from modifier_groups mg where mg.product_id = p.id and mg.name = 'نوع الخبز');

insert into modifiers (modifier_group_id, name, price_delta, display_order)
select mg.id, v.name, v.price_delta, v.display_order
from modifier_groups mg
join products p on p.id = mg.product_id
join (values ('خبز عادي', 0.00, 1), ('خبز بريوش', 3.00, 2)) as v(name, price_delta, display_order) on true
where p.name = 'برجر دجاج مقرمش' and mg.name = 'نوع الخبز'
  and not exists (select 1 from modifiers m where m.modifier_group_id = mg.id and m.name = v.name);

insert into modifier_groups (product_id, name, is_required, min_select, max_select, display_order)
select p.id, 'أضف أو احذف مكونات', false, 0, 3, 2
from products p
where p.name = 'برجر دجاج مقرمش'
  and not exists (select 1 from modifier_groups mg where mg.product_id = p.id and mg.name = 'أضف أو احذف مكونات');

insert into modifiers (modifier_group_id, name, price_delta, display_order)
select mg.id, v.name, v.price_delta, v.display_order
from modifier_groups mg
join products p on p.id = mg.product_id
join (values
  ('بدون خس', 0.00, 1),
  ('بدون مايونيز', 0.00, 2),
  ('جبن إضافي', 4.00, 3)
) as v(name, price_delta, display_order) on true
where p.name = 'برجر دجاج مقرمش' and mg.name = 'أضف أو احذف مكونات'
  and not exists (select 1 from modifiers m where m.modifier_group_id = mg.id and m.name = v.name);

-- 5.3) برجر دبل تشيز: أضف أو احذف مكونات (اختياري)
insert into modifier_groups (product_id, name, is_required, min_select, max_select, display_order)
select p.id, 'أضف أو احذف مكونات', false, 0, 5, 1
from products p
where p.name = 'برجر دبل تشيز'
  and not exists (select 1 from modifier_groups mg where mg.product_id = p.id and mg.name = 'أضف أو احذف مكونات');

insert into modifiers (modifier_group_id, name, price_delta, display_order)
select mg.id, v.name, v.price_delta, v.display_order
from modifier_groups mg
join products p on p.id = mg.product_id
join (values
  ('جبن إضافي', 4.00, 1),
  ('بيكون', 6.00, 2),
  ('بصل مكرمل', 3.00, 3),
  ('صلصة حارة', 0.00, 4),
  ('بدون مخلل', 0.00, 5)
) as v(name, price_delta, display_order) on true
where p.name = 'برجر دبل تشيز' and mg.name = 'أضف أو احذف مكونات'
  and not exists (select 1 from modifiers m where m.modifier_group_id = mg.id and m.name = v.name);

-- 6) وجبات (Combos)
insert into combos (name, description, price)
select 'وجبة كلاسيك', 'برجر لحم كلاسيك + بطاطس مقلية + بيبسي', 38.00
where not exists (select 1 from combos where name = 'وجبة كلاسيك');

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1 from combos c join products p on p.name = 'برجر لحم كلاسيك'
where c.name = 'وجبة كلاسيك'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1 from combos c join products p on p.name = 'بطاطس مقلية'
where c.name = 'وجبة كلاسيك'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1 from combos c join products p on p.name = 'بيبسي'
where c.name = 'وجبة كلاسيك'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

insert into combos (name, description, price)
select 'وجبة دبل تشيز', 'برجر دبل تشيز + بطاطس بالجبن والصلصة + عصير برتقال', 52.00
where not exists (select 1 from combos where name = 'وجبة دبل تشيز');

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1 from combos c join products p on p.name = 'برجر دبل تشيز'
where c.name = 'وجبة دبل تشيز'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1 from combos c join products p on p.name = 'بطاطس بالجبن والصلصة'
where c.name = 'وجبة دبل تشيز'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);

insert into combo_items (combo_id, product_id, quantity)
select c.id, p.id, 1 from combos c join products p on p.name = 'عصير برتقال طازج'
where c.name = 'وجبة دبل تشيز'
  and not exists (select 1 from combo_items ci where ci.combo_id = c.id and ci.product_id = p.id);
