-- جلسات عمل الكاشير (ورديات): تُفتح تلقائياً عند تسجيل الدخول وتُغلق عند
-- الخروج. المبالغ نفسها لا تُخزَّن هنا — تُحسب من orders/payments وقت الحاجة
-- (نفس نمط cash_closings)، وهذا الجدول فقط يحدد حدود الوقت (opened_at/closed_at)
-- والموظف صاحب الجلسة اللي يحدد نطاق الحساب.
create table cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create index cashier_shifts_employee_id_idx on cashier_shifts (employee_id);

alter table cashier_shifts enable row level security;
-- بدون أي سياسة anon/authenticated عمداً — وصول حصراً عبر service_role من
-- Server Actions بعد التحقق من جلسة الموظف المخصصة، نفس بقية الجداول الداخلية.

-- لازم نعرف مين قبِل كل طلب إلكتروني ومتى، عشان نقدر ننسب قيمته لجلسة
-- الكاشير الصحيحة بوقت القبول (مو وقت إنشاء الطلب نفسه من العميل، اللي قد
-- يسبق فتح الجلسة بوقت طويل).
alter table orders
  add column accepted_by_employee_id uuid references employees (id),
  add column accepted_at timestamptz;
