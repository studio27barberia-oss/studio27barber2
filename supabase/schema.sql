-- =====================================================================
-- BARBER OS — Esquema completo para Supabase (Postgres)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr todo.
-- Es seguro volver a correrlo (usa IF NOT EXISTS / OR REPLACE donde aplica),
-- pero si ya tienes datos, revisa antes de re-ejecutar los CREATE TABLE.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. PERFILES / ROLES
-- No usamos una tabla "users" propia: Supabase Auth ya maneja usuarios
-- en auth.users (correo, password hasheado, etc). Aquí solo guardamos
-- el ROL y, si es barbero, a qué barbero corresponde.
-- =====================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'recepcion', 'barbero')),
  barber_id uuid, -- se referencia a barbers(id) más abajo (fk se agrega después de crear barbers)
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 2. BARBEROS
-- =====================================================================
create table if not exists barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  commission_pct numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_barber_id_fkey
  foreign key (barber_id) references barbers(id) on delete set null;

-- =====================================================================
-- 3. SERVICIOS (catálogo)
-- =====================================================================
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  duration_minutes int not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 4. PRODUCTOS
-- =====================================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  stock int not null default 0,
  category text,
  commission_pct numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 5. CLIENTES
-- =====================================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  visits int not null default 0,
  total_spent numeric(12,2) not null default 0,
  last_visit date,
  preferred_barber_id uuid references barbers(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 6. VENTAS (permanentes — nunca se borran ni se reinician)
-- Guarda "snapshots" (nombre y % de comisión al momento de la venta)
-- para que cambios futuros en barbero/producto NO alteren ventas pasadas.
-- =====================================================================
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default (now() at time zone 'utc')::date,
  sale_time time not null default (now() at time zone 'utc')::time,
  barber_id uuid not null references barbers(id),
  barber_name_snapshot text not null,
  commission_pct_snapshot numeric(5,2) not null,
  client_id uuid references clients(id) on delete set null,
  client_name_snapshot text,
  subtotal numeric(12,2) not null,
  tip numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  payment_method text not null check (payment_method in ('efectivo','tarjeta','transferencia')),
  service_commission numeric(12,2) not null default 0,
  product_commission numeric(12,2) not null default 0,
  commission_total numeric(12,2) not null default 0,
  registered_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_date on sales(sale_date);
create index if not exists idx_sales_barber on sales(barber_id);
create index if not exists idx_sales_payment on sales(payment_method);

-- Detalle de servicios vendidos en cada venta
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete restrict,
  service_id uuid references services(id),
  service_name_snapshot text not null,
  price_snapshot numeric(10,2) not null
);
create index if not exists idx_sale_items_sale on sale_items(sale_id);

-- Detalle de productos vendidos en cada venta
create table if not exists sale_products (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete restrict,
  product_id uuid references products(id),
  product_name_snapshot text not null,
  price_snapshot numeric(10,2) not null,
  qty int not null default 1,
  commission_pct_snapshot numeric(5,2) not null default 0
);
create index if not exists idx_sale_products_sale on sale_products(sale_id);

-- =====================================================================
-- 7. CITAS
-- =====================================================================
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  appt_date date not null,
  appt_time time not null,
  client_name text not null,
  phone text,
  barber_id uuid references barbers(id),
  service_id uuid references services(id),
  duration_minutes int,
  status text not null default 'pendiente'
    check (status in ('pendiente','confirmada','atendida','cancelada','no_asistio')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_appointments_date on appointments(appt_date);

-- =====================================================================
-- 8. FUNCIONES AUXILIARES DE ROL (para las políticas RLS)
-- =====================================================================
create or replace function current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_barber_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select barber_id from profiles where id = auth.uid();
$$;

-- =====================================================================
-- 9. FUNCIÓN TRANSACCIONAL PARA REGISTRAR UNA VENTA
-- Todo (venta + servicios + productos + descuento de inventario +
-- actualización de cliente) ocurre en una sola transacción atómica en
-- el servidor. Así evitamos condiciones de carrera (dos recepciones
-- vendiendo el último producto en inventario al mismo tiempo) y nos
-- aseguramos de que la comisión se calcule siempre igual, sin importar
-- qué dispositivo la registre.
-- =====================================================================
create or replace function create_sale(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := current_role_name();
  v_barber_id uuid := (payload->>'barber_id')::uuid;
  v_barber record;
  v_client_id uuid := nullif(payload->>'client_id','')::uuid;
  v_client_name text := payload->>'client_name';
  v_tip numeric := coalesce((payload->>'tip')::numeric, 0);
  v_payment_method text := payload->>'payment_method';
  v_services jsonb := coalesce(payload->'services', '[]'::jsonb);
  v_products jsonb := coalesce(payload->'products', '[]'::jsonb);
  v_service_subtotal numeric := 0;
  v_product_subtotal numeric := 0;
  v_service_commission numeric := 0;
  v_product_commission numeric := 0;
  v_sale_id uuid;
  v_item jsonb;
  v_svc record;
  v_prod record;
  v_qty int;
begin
  if v_role not in ('admin','recepcion') then
    raise exception 'No tienes permiso para registrar ventas';
  end if;

  select * into v_barber from barbers where id = v_barber_id and active = true;
  if not found then
    raise exception 'Barbero inválido o inactivo';
  end if;

  if v_payment_method not in ('efectivo','tarjeta','transferencia') then
    raise exception 'Método de pago inválido';
  end if;

  -- crear la venta primero (subtotal/total se actualizan al final)
  insert into sales (
    barber_id, barber_name_snapshot, commission_pct_snapshot,
    client_id, client_name_snapshot,
    subtotal, tip, total, payment_method,
    service_commission, product_commission, commission_total,
    registered_by
  ) values (
    v_barber.id, v_barber.name, v_barber.commission_pct,
    v_client_id, v_client_name,
    0, v_tip, 0, v_payment_method,
    0, 0, 0,
    auth.uid()
  ) returning id into v_sale_id;

  -- servicios
  for v_item in select * from jsonb_array_elements(v_services) loop
    select * into v_svc from services where id = (v_item->>'id')::uuid;
    if not found then
      raise exception 'Servicio inválido: %', v_item->>'id';
    end if;
    insert into sale_items (sale_id, service_id, service_name_snapshot, price_snapshot)
    values (v_sale_id, v_svc.id, v_svc.name, v_svc.price);
    v_service_subtotal := v_service_subtotal + v_svc.price;
  end loop;

  v_service_commission := round(v_service_subtotal * (v_barber.commission_pct / 100.0), 2);

  -- productos (con control de inventario)
  for v_item in select * from jsonb_array_elements(v_products) loop
    v_qty := coalesce((v_item->>'qty')::int, 1);
    select * into v_prod from products where id = (v_item->>'id')::uuid for update;
    if not found then
      raise exception 'Producto inválido: %', v_item->>'id';
    end if;
    if v_prod.stock < v_qty then
      raise exception 'Inventario insuficiente para "%": disponible %, solicitado %', v_prod.name, v_prod.stock, v_qty;
    end if;

    insert into sale_products (sale_id, product_id, product_name_snapshot, price_snapshot, qty, commission_pct_snapshot)
    values (v_sale_id, v_prod.id, v_prod.name, v_prod.price, v_qty, v_prod.commission_pct);

    update products set stock = stock - v_qty where id = v_prod.id;

    v_product_subtotal := v_product_subtotal + (v_prod.price * v_qty);
    v_product_commission := v_product_commission + round((v_prod.price * v_qty) * (v_prod.commission_pct / 100.0), 2);
  end loop;

  -- actualizar totales de la venta
  update sales set
    subtotal = v_service_subtotal + v_product_subtotal,
    total = v_service_subtotal + v_product_subtotal + v_tip,
    service_commission = v_service_commission,
    product_commission = v_product_commission,
    commission_total = v_service_commission + v_product_commission
  where id = v_sale_id;

  -- actualizar cliente (si se indicó uno existente o se creó uno nuevo antes de llamar esta función)
  if v_client_id is not null then
    update clients set
      visits = visits + 1,
      total_spent = total_spent + (v_service_subtotal + v_product_subtotal + v_tip),
      last_visit = (now() at time zone 'utc')::date,
      preferred_barber_id = v_barber.id
    where id = v_client_id;
  end if;

  return v_sale_id;
end;
$$;

-- =====================================================================
-- 10. ROW LEVEL SECURITY
-- =====================================================================
alter table profiles enable row level security;
alter table barbers enable row level security;
alter table services enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table sale_products enable row level security;
alter table appointments enable row level security;

-- PROFILES: cada quien ve su propio perfil; admin ve todos.
create policy profiles_select on profiles for select
  using (id = auth.uid() or current_role_name() = 'admin');
create policy profiles_update_admin on profiles for update
  using (current_role_name() = 'admin');
create policy profiles_insert_admin on profiles for insert
  with check (current_role_name() = 'admin');

-- BARBERS: cualquier usuario autenticado puede leer; solo admin escribe.
create policy barbers_select on barbers for select
  using (auth.role() = 'authenticated');
create policy barbers_write_admin on barbers for insert
  with check (current_role_name() = 'admin');
create policy barbers_update_admin on barbers for update
  using (current_role_name() = 'admin');
create policy barbers_delete_admin on barbers for delete
  using (current_role_name() = 'admin');

-- SERVICES: lectura para todos los autenticados; escritura solo admin.
create policy services_select on services for select
  using (auth.role() = 'authenticated');
create policy services_insert_admin on services for insert
  with check (current_role_name() = 'admin');
create policy services_update_admin on services for update
  using (current_role_name() = 'admin');
create policy services_delete_admin on services for delete
  using (current_role_name() = 'admin');

-- PRODUCTS: lectura para todos los autenticados; precio/comisión solo admin.
-- (el descuento de stock ocurre vía create_sale(), que es SECURITY DEFINER
-- y por lo tanto no depende de estas políticas de UPDATE)
create policy products_select on products for select
  using (auth.role() = 'authenticated');
create policy products_insert_admin on products for insert
  with check (current_role_name() = 'admin');
create policy products_update_admin on products for update
  using (current_role_name() = 'admin');
create policy products_delete_admin on products for delete
  using (current_role_name() = 'admin');

-- CLIENTS: admin y recepción pueden ver/crear; eliminar solo admin.
create policy clients_select on clients for select
  using (current_role_name() in ('admin','recepcion'));
create policy clients_insert on clients for insert
  with check (current_role_name() in ('admin','recepcion'));
create policy clients_update on clients for update
  using (current_role_name() in ('admin','recepcion'));
create policy clients_delete_admin on clients for delete
  using (current_role_name() = 'admin');

-- SALES: NUNCA se permite update ni delete directo -> historial permanente.
-- Los inserts SOLO ocurren a través de create_sale() (security definer),
-- así que no se otorga política de insert directa.
create policy sales_select on sales for select
  using (
    current_role_name() in ('admin','recepcion')
    or (current_role_name() = 'barbero' and barber_id = current_barber_id())
  );

-- SALE_ITEMS / SALE_PRODUCTS: visibilidad heredada de la venta asociada.
create policy sale_items_select on sale_items for select
  using (
    exists (
      select 1 from sales s
      where s.id = sale_items.sale_id
        and (
          current_role_name() in ('admin','recepcion')
          or (current_role_name() = 'barbero' and s.barber_id = current_barber_id())
        )
    )
  );

create policy sale_products_select on sale_products for select
  using (
    exists (
      select 1 from sales s
      where s.id = sale_products.sale_id
        and (
          current_role_name() in ('admin','recepcion')
          or (current_role_name() = 'barbero' and s.barber_id = current_barber_id())
        )
    )
  );

-- APPOINTMENTS: admin/recepción ven y gestionan todas; barbero solo las suyas.
create policy appointments_select on appointments for select
  using (
    current_role_name() in ('admin','recepcion')
    or (current_role_name() = 'barbero' and barber_id = current_barber_id())
  );
create policy appointments_insert on appointments for insert
  with check (current_role_name() in ('admin','recepcion','barbero'));
create policy appointments_update on appointments for update
  using (current_role_name() in ('admin','recepcion'));
create policy appointments_delete on appointments for delete
  using (current_role_name() in ('admin','recepcion'));

-- =====================================================================
-- 11. PERMISOS DE EJECUCIÓN
-- =====================================================================
grant execute on function create_sale(jsonb) to authenticated;
grant execute on function current_role_name() to authenticated;
grant execute on function current_barber_id() to authenticated;

-- =====================================================================
-- 12. CÓMO CREAR EL PRIMER USUARIO ADMINISTRADOR
-- =====================================================================
-- 1) Ve a Supabase Dashboard -> Authentication -> Users -> "Add user"
--    y crea un usuario con correo y contraseña (marca "Auto Confirm User").
-- 2) Copia el UUID de ese usuario (columna "UID").
-- 3) Corre esto reemplazando el UUID y el nombre:
--
--    insert into profiles (id, full_name, role)
--    values ('PEGA-AQUI-EL-UUID', 'Nombre del dueño', 'admin');
--
-- Para crear un usuario de recepción o barbero, repite el proceso con
-- role = 'recepcion' o role = 'barbero'. Si es 'barbero', además llena
-- barber_id con el id de su fila en la tabla barbers.

-- =====================================================================
-- 13. ACTIVAR SUPABASE REALTIME
-- Sin esto, aunque el código del frontend se suscriba con
-- supabase.channel(...).on('postgres_changes', ...), NUNCA llegará
-- ningún evento: Postgres solo transmite cambios de las tablas que
-- están agregadas a la publicación "supabase_realtime".
-- =====================================================================
alter publication supabase_realtime add table sales;
alter publication supabase_realtime add table sale_items;
alter publication supabase_realtime add table sale_products;
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table barbers;
alter publication supabase_realtime add table services;
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table clients;

-- REPLICA IDENTITY FULL: para que los eventos UPDATE/DELETE incluyan
-- la fila completa "antes" del cambio (útil si en el futuro quieres
-- reaccionar a qué cambió exactamente, no solo "algo cambió").
alter table sales replica identity full;
alter table sale_items replica identity full;
alter table sale_products replica identity full;
alter table appointments replica identity full;
alter table barbers replica identity full;
alter table services replica identity full;
alter table products replica identity full;
alter table clients replica identity full;
