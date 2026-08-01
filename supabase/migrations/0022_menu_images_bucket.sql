-- سلة تخزين عامة لصور الأصناف/الوجبات/المكافآت — عامة (public) لأن صور المنيو
-- غير حساسة، وهذا يعفينا من روابط موقّعة (Signed URLs) أو أي سياسة RLS إضافية
-- لجدول storage.objects: الرفع حصراً عبر service_role من لوحة الإدارة (يتجاوز RLS
-- أصلاً)، والقراءة عامة تلقائياً لأي سلة public بغض النظر عن RLS.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;
