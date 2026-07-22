-- إعدادات مشتركة تحتاجها بقية الملفات: امتدادات + دالة تحديث updated_at تلقائياً

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
