-- سياسات RLS اللي تشترط is_available = true تمنع Realtime من توصيل حدث
-- "صار غير متاح" أصلاً (الصف الجديد بعد التحديث ما يجتاز الشرط، فـ postgres_changes
-- ما توصل الحدث للمشترك). الحل: نسمح بقراءة كل الأصناف غير المحذوفة، والفلترة
-- الفعلية لعرض "متاح/نافد" تصير بالتطبيق (JS) بدل قاعدة البيانات.

drop policy "products_public_read" on products;

create policy "products_public_read"
  on products for select
  to anon, authenticated
  using (deleted_at is null);

drop policy "combos_public_read" on combos;

create policy "combos_public_read"
  on combos for select
  to anon, authenticated
  using (deleted_at is null);
