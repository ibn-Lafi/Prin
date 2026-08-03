-- يسمح بحذف صنف أو وجبة نهائياً حتى لو كانت مربوطة بمكافأة استبدال —
-- بدل ما يُمنع الحذف بقيد RESTRICT، تصير المكافأة "غير مربوطة" (نفس حالة
-- مكافأة يدوية عادية بدون ربط صنف/وجبة، تدعمها rewards.product_id/combo_id
-- أصلاً كحقلين اختياريين). هذا تغيير آمن تماماً ولا يفقد أي بيانات تاريخية —
-- بعكس order_items/order_item_modifiers اللي تبقى RESTRICT عمداً لأنها سجلات
-- فواتير سابقة (لازم تبقى كاملة لأغراض التقارير والامتثال الضريبي).
alter table rewards drop constraint if exists rewards_product_id_fkey;
alter table rewards
  add constraint rewards_product_id_fkey foreign key (product_id) references products (id) on delete set null;

alter table rewards drop constraint if exists rewards_combo_id_fkey;
alter table rewards
  add constraint rewards_combo_id_fkey foreign key (combo_id) references combos (id) on delete set null;
