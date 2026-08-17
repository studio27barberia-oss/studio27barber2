-- =====================================================================
-- Ejecuta esto en el SQL Editor de Supabase SI YA corriste schema.sql
-- antes y solo necesitas activar Realtime sin recrear las tablas.
-- Es seguro volver a correrlo: si una tabla ya está en la publicación,
-- Postgres da un aviso (no un error) y sigue con las demás.
-- =====================================================================
alter publication supabase_realtime add table sales;
alter publication supabase_realtime add table sale_items;
alter publication supabase_realtime add table sale_products;
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table barbers;
alter publication supabase_realtime add table services;
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table clients;

alter table sales replica identity full;
alter table sale_items replica identity full;
alter table sale_products replica identity full;
alter table appointments replica identity full;
alter table barbers replica identity full;
alter table services replica identity full;
alter table products replica identity full;
alter table clients replica identity full;
