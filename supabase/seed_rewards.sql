-- مكافآت تجريبية لتجربة تبويب "استبدل" — آمن للتشغيل أكثر من مرة.
-- discount_amount = القيمة النقدية الفعلية المطبَّقة كخصم وقت الاستبدال
-- (يضبطها المدير لاحقاً بلوحة الإدارة — الأرقام هنا تقريبية للتجربة فقط).
insert into rewards (name, description, points_cost, discount_amount)
select 'بيبسي مجاني', 'استبدل نقاطك بمشروب مجاني', 100, 8.00
where not exists (select 1 from rewards where name = 'بيبسي مجاني');

update rewards set discount_amount = 8.00
where name = 'بيبسي مجاني' and discount_amount = 0;

insert into rewards (name, description, points_cost, discount_amount)
select 'وجبة كلاسيك مجانية', 'استبدل نقاطك بوجبة كاملة', 800, 28.00
where not exists (select 1 from rewards where name = 'وجبة كلاسيك مجانية');

update rewards set discount_amount = 28.00
where name = 'وجبة كلاسيك مجانية' and discount_amount = 0;
