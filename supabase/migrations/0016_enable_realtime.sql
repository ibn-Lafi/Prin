-- تفعيل Realtime الفعلي لهذي الجداول (Supabase ما يفعّله تلقائياً بمجرد وجود RLS)
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table combos;
alter publication supabase_realtime add table restaurant_settings;
