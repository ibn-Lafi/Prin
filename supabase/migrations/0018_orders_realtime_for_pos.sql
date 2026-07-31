-- يسمح لموظفي الكاشير (بدون Supabase Auth، يتصلون كـ anon) باستقبال إشعار
-- Realtime فوري بالطلبات الإلكترونية الجديدة. النطاق ضيّق عمداً:
--   * فقط الطلبات الأونلاين وبحالة "received" (يعني دُفعت فعلاً عبر Webhook
--     Moyasar، بانتظار استلام الكاشير — نفس نافذة "استلام وطباعة" بالمواصفة)
--   * فقط أعمدة جدول orders نفسه (مبالغ إجمالية وتوقيت) — بدون تفاصيل
--     الأصناف (order_items) ولا هوية العميل (لا نضيف أي policy لجدول customers
--     هنا). التفاصيل الكاملة تُجلب فقط عبر Server Action بـ service_role
--     بمجرد وصول إشعار Realtime، بنفس نمط باقي عمليات الكاشير الحساسة.
--   * بمجرد ما يقبل الكاشير الطلب (status = 'accepted') يختفي تلقائياً من
--     نطاق الصلاحية هذا — بدون أي خطوة يدوية لإخفائه.
create policy "orders_anon_read_pending_online"
  on orders for select
  to anon
  using (channel = 'online' and status = 'received');

alter publication supabase_realtime add table orders;
