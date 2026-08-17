import React, { useState } from "react";
import { T } from "../lib/theme";
import { DAYS, mx, weekRangeDates, isoWeekday, todayStr } from "../utils/format";
import { useSales } from "../hooks/useSales";
import { Panel, Pill, SectionTitle, StatCard } from "./ui";

export default function Semana() {
  const dates = weekRangeDates();
  const { sales, loading } = useSales({ from: dates[0], to: dates[6] });
  const [selIdx, setSelIdx] = useState(Math.min(isoWeekday(todayStr()), 6));
  const date = dates[selIdx];

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando…</div>;

  const daySales = sales.filter((s) => s.sale_date === date);
  const revenue = daySales.reduce((a, s) => a + Number(s.total), 0);
  const tips = daySales.reduce((a, s) => a + Number(s.tip), 0);
  const commission = daySales.reduce((a, s) => a + Number(s.commission_total), 0);
  const byMethod = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  daySales.forEach((s) => byMethod[s.payment_method] += Number(s.total));

  const byBarber = {};
  daySales.forEach((s) => {
    byBarber[s.barber_id] = byBarber[s.barber_id] || { name: s.barber_name_snapshot, services: 0, sales: 0, tips: 0, commission: 0 };
    byBarber[s.barber_id].services += (s.sale_items || []).length;
    byBarber[s.barber_id].sales += Number(s.total);
    byBarber[s.barber_id].tips += Number(s.tip);
    byBarber[s.barber_id].commission += Number(s.commission_total);
  });

  return (
    <div>
      <SectionTitle>Semana</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {DAYS.map((d, i) => <Pill key={d} active={selIdx === i} onClick={() => setSelIdx(i)}>{d}</Pill>)}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Ventas" value={mx(revenue)} />
        <StatCard label="Servicios" value={daySales.reduce((a, s) => a + (s.sale_items || []).length, 0)} />
        <StatCard label="Propinas" value={mx(tips)} />
        <StatCard label="Comisiones" value={mx(commission)} />
        <StatCard label="Efectivo" value={mx(byMethod.efectivo)} />
        <StatCard label="Tarjeta" value={mx(byMethod.tarjeta)} />
        <StatCard label="Transferencia" value={mx(byMethod.transferencia)} />
      </div>
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: T.bone, textAlign: "left" }}>
              {["Barbero", "Servicios", "Ventas", "Propinas", "Comisión"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", color: T.slate, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(byBarber).map((b) => (
              <tr key={b.name} style={{ borderTop: `1px solid ${T.line}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 700 }}>{b.name}</td>
                <td style={{ padding: "10px 14px" }}>{b.services}</td>
                <td style={{ padding: "10px 14px" }}>{mx(b.sales)}</td>
                <td style={{ padding: "10px 14px" }}>{mx(b.tips)}</td>
                <td style={{ padding: "10px 14px" }}>{mx(b.commission)}</td>
              </tr>
            ))}
            {Object.values(byBarber).length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: T.slate }}>Sin ventas ese día.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
