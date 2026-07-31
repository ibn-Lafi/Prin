-- المكافآت غير مربوطة بصنف معيّن بالمخطط الحالي (اسم + تكلفة نقاط فقط)، فبدون
-- قيمة نقدية محددة لا يمكن لأي RPC حساب الخصم فعلياً على الفاتورة. نضيف قيمة
-- نقدية ثابتة لكل مكافأة (يضبطها المدير لاحقاً بلوحة الإدارة، يدوياً حالياً)
-- تُطبَّق كخصم على المجموع الفرعي وقت الاستبدال — قبل حساب الضريبة (الضريبة
-- تُحسب على الصافي بعد الخصم، الطريقة الصحيحة ضريبياً).
alter table rewards
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);

alter table orders
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  add column redeemed_reward_id uuid references rewards (id) on delete set null;
