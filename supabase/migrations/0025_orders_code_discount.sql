-- خصم كود ترويجي منفصل عن خصم استبدال المكافأة (discount_amount) — يبقيان
-- مستقلين حتى تقدر الفاتورة/التقارير تعرض كل نوع خصم بسطر خاص به بدل رقم
-- مدمج يضيع مصدره.
alter table orders
  add column code_discount_amount numeric(10, 2) not null default 0 check (code_discount_amount >= 0),
  add column discount_code_id uuid references discount_codes (id) on delete set null;
