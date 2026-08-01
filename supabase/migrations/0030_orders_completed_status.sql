-- يضيف حالة "completed" لدورة حياة الطلب الإلكتروني: بعد ما يقبل الكاشير
-- الطلب (accepted) ويجهّزه، يحتاج فعل واضح لتأكيد تسليمه فعلياً للعميل —
-- بدونها كانت حالة "accepted" تبقى نهائية بلا أي طريقة لإخراج الطلب من
-- قائمة "النشطة" بالكاشير أو نقله لتبويب "الطلبات السابقة" بالمنيو الإلكتروني.
alter table orders drop constraint orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending_payment', 'received', 'accepted', 'completed', 'cancelled'));
