-- سجل الأحداث الحساسة: إلغاء طلب، استرجاع، تعديل سعر، دخول/خروج موظف،
-- تعديل نقاط يدوي، تغيير إعدادات. يُكتب فقط من السيرفر (service_role)
-- ويُقرأ فقط من لوحة الإدارة عبر السيرفر — بدون وصول مباشر لأي دور آخر.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees (id) on delete set null,
  action_type text not null check (
    action_type in (
      'order_cancel',
      'refund',
      'price_change',
      'employee_login',
      'employee_logout',
      'manual_points_adjustment',
      'settings_change'
    )
  ),
  description text not null,
  related_order_id uuid references orders (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_employee_id_idx on audit_log (employee_id);
create index audit_log_created_at_idx on audit_log (created_at);

alter table audit_log enable row level security;
