-- إحداثيات كل فرع (اختيارية) — تُستخدم بالمنيو الإلكتروني لحساب مسافة
-- العميل عن كل فرع وترتيبها (الأقرب أولاً) بصفحة اختيار الفرع.
alter table branches add column if not exists latitude double precision;
alter table branches add column if not exists longitude double precision;

notify pgrst, 'reload schema';
