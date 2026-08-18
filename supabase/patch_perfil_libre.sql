-- =====================================================================
-- PATCH: en "Nueva venta", CUALQUIER perfil (recepción o barbero) puede
-- elegir a nombre de qué barbero es la venta — ya no se restringe a que
-- un barbero solo pueda venderse a sí mismo. Útil cuando varios barberos
-- comparten un mismo dispositivo/inicio de sesión.
--
-- Ejecuta esto en el SQL Editor de Supabase. Es seguro correrlo varias
-- veces, y no importa si antes corriste patch_barbero_selfservice.sql
-- (este lo reemplaza).
-- =====================================================================

-- 1) create_sale(): el rol 'barbero' ahora tiene el mismo permiso que
--    'recepcion' para elegir cualquier barbero activo.
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
  if v_role not in ('admin','recepcion','barbero') then
    raise exception 'No tienes permiso para registrar ventas';
  end if;

  select * into v_barber from barbers where id = v_barber_id and active = true;
  if not found then
    raise exception 'Barbero inválido o inactivo';
  end if;

  if v_payment_method not in ('efectivo','tarjeta','transferencia') then
    raise exception 'Método de pago inválido';
  end if;

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

  update sales set
    subtotal = v_service_subtotal + v_product_subtotal,
    total = v_service_subtotal + v_product_subtotal + v_tip,
    service_commission = v_service_commission,
    product_commission = v_product_commission,
    commission_total = v_service_commission + v_product_commission
  where id = v_sale_id;

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

grant execute on function create_sale(jsonb) to authenticated;

-- 2) appointments: mismo criterio — cualquier perfil autorizado
--    (admin, recepción o barbero) puede crear una cita para cualquier
--    barbero activo, no solo para sí mismo.
drop policy if exists appointments_insert on appointments;
create policy appointments_insert on appointments for insert
  with check (current_role_name() in ('admin','recepcion','barbero'));
