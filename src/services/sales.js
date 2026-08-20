import { supabase } from "../lib/supabase";
import { todayStr } from "../utils/format";

// Registra una venta completa (servicios + productos + inventario + cliente)
// de forma atómica, ejecutando la función SQL create_sale() en el servidor.
// payload: { barber_id, client_id, client_name, tip, payment_method,
//            services: [{id}], products: [{id, qty}] }
export async function createSale(payload) {
  const { data, error } = await supabase.rpc("create_sale", { payload });
  if (error) throw error;
  return data; // uuid de la venta creada
}

// Trae ventas dentro de un rango de fechas, con filtros opcionales.
// Esto es lo único que necesitan "Hoy", "Semana", "Mes" e "Historial":
// todos filtran sobre la misma tabla permanente, nunca se borra nada.
export async function getSales({ from, to, barberId, paymentMethod, serviceId } = {}) {
  let query = supabase
    .from("sales")
    .select(`
      id, sale_date, sale_time, barber_id, barber_name_snapshot,
      client_name_snapshot, subtotal, tip, total, payment_method,
      service_commission, product_commission, commission_total,
      sale_items ( id, service_id, service_name_snapshot, price_snapshot ),
      sale_products ( id, product_id, product_name_snapshot, price_snapshot, qty, commission_pct_snapshot )
    `)
    .order("sale_date", { ascending: false })
    .order("sale_time", { ascending: false });

  if (from) query = query.gte("sale_date", from);
  if (to) query = query.lte("sale_date", to);
  if (barberId) query = query.eq("barber_id", barberId);
  if (paymentMethod) query = query.eq("payment_method", paymentMethod);

  const { data, error } = await query;
  if (error) throw error;

  if (serviceId) {
    return data.filter((s) => (s.sale_items || []).some((i) => i.service_id === serviceId));
  }
  return data;
}

export async function getSalesToday() {
  const today = todayStr();
  return getSales({ from: today, to: today });
}

// Las ventas son de solo-inserción: nunca se editan ni se borran (así
// se protege el historial permanente). Por eso basta con escuchar el
// evento INSERT — es más preciso que "*" y evita procesar eventos que
// nunca van a ocurrir en estas tablas.
export function subscribeToSales(onChange) {
  const channel = supabase
    .channel("sales-realtime")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales" }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "sale_items" }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "sale_products" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
