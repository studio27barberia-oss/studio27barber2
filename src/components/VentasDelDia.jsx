import React, { useState } from "react";
import { Wallet, Scissors, Gift, TrendingUp, Search } from "lucide-react";
import { T } from "../lib/theme";
import { PAY_METHODS, mx, todayStr } from "../utils/format";
import { useSales } from "../hooks/useSales";
import { Panel, Pill, SectionTitle, StatCard, inputStyle } from "./ui";

export default function VentasDelDia() {
  const today = todayStr();
  const { sales, loading } = useSales({ from: today, to: today });
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando…</div>;

  let filtered = sales;
  if (filter !== "todos") filtered = filtered.filter((s) => s.payment_method === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((s) =>
      (s.barber_name_snapshot || "").toLowerCase().includes(q) ||
      (s.client_name_snapshot || "").toLowerCase().includes(q)
    );
  }

  const total = sales.reduce((a, s) => a + Number(s.total), 0);
  const tips = sales.reduce((a, s) => a + Number(s.tip), 0);
  const commission = sales.reduce((a, s) => a + Number(s.commission_total), 0);
  const byMethod = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  sales.forEach((s) => byMethod[s.payment_method] += Number(s.total));

  return (
    <div>
      <SectionTitle>Ventas del día</SectionTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Total vendido" value={mx(total)} icon={Wallet} />
        <StatCard label="Servicios" value={sales.length} icon={Scissors} />
        <StatCard label="Propinas" value={mx(tips)} icon={Gift} />
        <StatCard label="Comisiones" value={mx(commission)} icon={TrendingUp} />
        <StatCard label="Efectivo" value={mx(byMethod.efectivo)} />
        <StatCard label="Tarjeta" value={mx(byMethod.tarjeta)} />
        <StatCard label="Transferencia" value={mx(byMethod.transferencia)} />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["todos", "efectivo", "tarjeta", "transferencia"].map((f) => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</Pill>
        ))}
        <div style={{ position: "relative", minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: T.slate }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por barbero o cliente…"
            style={{ ...inputStyle(true), padding: "8px 10px 8px 30px", fontSize: 13 }} />
        </div>
      </div>

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: T.bone, textAlign: "left" }}>
              {["Hora", "Cliente", "Barbero", "Servicio", "Total", "Pago"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", color: T.slate, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td style={{ padding: "10px 14px" }}>{(s.sale_time || "").slice(0, 5)}</td>
                <td style={{ padding: "10px 14px" }}>{s.client_name_snapshot || "—"}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.barber_name_snapshot}</td>
                <td style={{ padding: "10px 14px", color: T.slate }}>{(s.sale_items || []).map((sv) => sv.service_name_snapshot).join(", ")}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700 }}>{mx(s.total)}</td>
                <td style={{ padding: "10px 14px" }}>{PAY_METHODS.find((m) => m.id === s.payment_method)?.label}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: T.slate }}>Aún no hay ventas registradas hoy.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
