-- أصناف "اقتراح إضافة سريعة" يختارها الإدمن يدوياً — تظهر بصفحة سلة
-- المنيو الإلكتروني عند وجود عناصر بالسلة (مثال: أضف مشروب/صوص/بطاطس).
alter table products add column if not exists is_cart_suggestion boolean not null default false;

notify pgrst, 'reload schema';
