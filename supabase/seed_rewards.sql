-- مكافآت تجريبية لتجربة تبويب "استبدل" — آمن للتشغيل أكثر من مرة.
insert into rewards (name, description, points_cost)
select 'بيبسي مجاني', 'استبدل نقاطك بمشروب مجاني', 100
where not exists (select 1 from rewards where name = 'بيبسي مجاني');

insert into rewards (name, description, points_cost)
select 'وجبة كلاسيك مجانية', 'استبدل نقاطك بوجبة كاملة', 800
where not exists (select 1 from rewards where name = 'وجبة كلاسيك مجانية');
