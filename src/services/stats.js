// Agregaciones calculadas en el cliente a partir de getSales().
// Con el volumen de ventas de una barbería esto es más que suficiente;
// si algún día el historial crece mucho, esto se puede mover a una
// vista SQL o a una función RPC de agregación en Supabase.
export function computeStats(sales) {
  const byDate = {};
  const byMethod = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  const byBarber = {};
  const byService = {};
  let totalTips = 0, totalCommission = 0, totalRevenue = 0;

  sales.forEach((s) => {
    const productRevenue = (s.sale_products || []).reduce((a, p) => a + p.price_snapshot * p.qty, 0);
    byDate[s.sale_date] = byDate[s.sale_date] || { revenue: 0, subtotal: 0, productRevenue: 0, tips: 0, commission: 0, count: 0 };
    byDate[s.sale_date].revenue += Number(s.total);
    byDate[s.sale_date].subtotal += Number(s.subtotal);
    byDate[s.sale_date].productRevenue += productRevenue;
    byDate[s.sale_date].tips += Number(s.tip);
    byDate[s.sale_date].commission += Number(s.commission_total);
    byDate[s.sale_date].count += 1;

    totalTips += Number(s.tip);
    totalCommission += Number(s.commission_total);
    totalRevenue += Number(s.total);
    byMethod[s.payment_method] = (byMethod[s.payment_method] || 0) + Number(s.total);

    byBarber[s.barber_id] = byBarber[s.barber_id] || { name: s.barber_name_snapshot, services: 0, sales: 0, tips: 0, commission: 0 };
    byBarber[s.barber_id].services += (s.sale_items || []).length;
    byBarber[s.barber_id].sales += Number(s.total);
    byBarber[s.barber_id].tips += Number(s.tip);
    byBarber[s.barber_id].commission += Number(s.commission_total);

    (s.sale_items || []).forEach((it) => {
      byService[it.service_name_snapshot] = (byService[it.service_name_snapshot] || 0) + 1;
    });
  });

  return { byDate, byMethod, byBarber, byService, totalTips, totalCommission, totalRevenue, count: sales.length };
}
