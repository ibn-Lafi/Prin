-- يضيف اعتماد اسم مستخدم/كلمة مرور لحسابات المدراء لدخول لوحة الإدارة، بدل
-- كود PIN المستخدَم حالياً — PIN يبقى كما هو حصراً لدخول الكاشير (POS)، فمدير
-- يعمل بالكاشير أيضاً يحتفظ بكلا الاعتمادين. الحقلان اختياريان على مستوى العمود
-- لأن حسابات "staff" ما تحتاجهما؛ إلزامية تعبئتهما لدور "manager" تُفرض بمنطق
-- التطبيق (Server Action) لا بقيد قاعدة بيانات، لتفادي كسر الصفوف الموجودة.
-- اسم المستخدم يُخزَّن دائماً بحروف صغيرة (تطبيع بالتطبيق) فالفهرس الفريد هنا
-- على القيمة الخام يكفي لمنع التكرار الفعلي.
alter table employees
  add column username text,
  add column password_hash text;

create unique index employees_username_unique_idx
  on employees (username)
  where username is not null;
