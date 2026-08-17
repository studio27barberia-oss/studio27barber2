import React from "react";
import { Wallet, Scissors, Users, TrendingUp, Gift, Package } from "lucide-react";
import { T } from "../lib/theme";
import { DAYS, mx, weekRangeDates, isoWeekday, todayStr } from "../utils/format";
import { useSales } from "../hooks/useSales";
import { computeStats } from "../services/stats";
import { Panel, SectionTitle, StatCard } from "./ui";

export default function Dashboard() {
  const dates = weekRangeDates();
  const { sales, loading } = useSales({ from: dates[0], to: dates[6] });
  const stats = computeStats(sales);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando dashboard…</div>;

  const weekTotals = dates.map((d) => stats.byDate[d]?.revenue || 0);
  const maxVal = Math.max(1, ...weekTotals);
  const weekRevenue = weekTotals.reduce((a, b) => a + b, 0);
  const weekServices = dates.reduce((a, d) => a + (stats.byDate[d]?.count ? (stats.byDate[d]?.count) : 0), 0);
  const weekServiceCount = sales.reduce((a, s) => a + (s.sale_items || []).length, 0);
  const weekTips = dates.reduce((a, d) => a + (stats.byDate[d]?.tips || 0), 0);
  const weekCommission = dates.reduce((a, d) => a + (stats.byDate[d]?.commission || 0), 0);
  const weekSubtotal = dates.reduce((a, d) => a + (stats.byDate[d]?.subtotal || 0), 0);
  const weekProductRevenue = dates.reduce((a, d) => a + (stats.byDate[d]?.productRevenue || 0), 0);
  const weekProfit = weekSubtotal - weekCommission;
  const weekTransactions = sales.length;

  const topServices = Object.entries(stats.byService).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxMethod = Math.max(1, ...Object.values(stats.byMethod));

  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ flex: "1 1 260px", minWidth: 220, borderRadius: 16, padding: "20px 22px", background: T.ink, color: T.bone }}>
          <div style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(250,246,238,0.65)", fontWeight: 600 }}>Ganancia total semanal</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.brass, marginTop: 6 }}>{mx(weekProfit)}</div>
          <div style={{ fontSize: 12, color: "rgba(250,246,238,0.55)", marginTop: 4 }}>Ventas de servicios y productos, ya descontadas las comisiones</div>
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 200, borderRadius: 16, padding: "20px 22px", background: T.bonePanel, border: `1px solid ${T.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: T.slate, fontWeight: 600 }}>Venta de productos</div>
            <Package size={16} color={T.brassDim} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, marginTop: 6 }}>{mx(weekProductRevenue)}</div>
          <div style={{ fontSize: 12, color: T.slate, marginTop: 4 }}>Esta semana</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Ventas totales (semana)" value={mx(weekRevenue)} icon={Wallet} accent={T.green} />
        <StatCard label="Servicios" value={weekServiceCount} icon={Scissors} />
        <StatCard label="Ventas" value={weekTransactions} icon={Users} />
        <StatCard label="Comisiones" value={mx(weekCommission)} icon={TrendingUp} />
        <StatCard label="Propinas" value={mx(weekTips)} icon={Gift} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Panel>
          <SectionTitle>Ventas por día</SectionTitle>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160 }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 11, color: T.slate }}>{weekTotals[i] > 0 ? mx(weekTotals[i]) : ""}</div>
                <div style={{ width: "100%", borderRadius: 6, background: i === isoWeekday(todayStr()) ? T.brass : T.ink, height: Math.max(4, (weekTotals[i] / maxVal) * 120) }} />
                <div style={{ fontSize: 10.5, color: T.slate }}>{d.slice(0, 3)}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle>Métodos de pago</SectionTitle>
          {Object.entries(stats.byMethod).map(([m, v]) => (
            <div key={m} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{m}</span><span>{mx(v)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: T.bone }}>
                <div style={{ height: 8, borderRadius: 6, width: `${(v / maxMethod) * 100}%`, background: T.brass }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 0" }}><SectionTitle>Rendimiento por barbero</SectionTitle></div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: T.bone, textAlign: "left" }}>
                {["Barbero", "Servicios", "Ventas", "Propinas", "Comisión"].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", color: T.slate, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(stats.byBarber).map((b) => (
                <tr key={b.name} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td style={{ padding: "10px 20px", fontWeight: 700 }}>{b.name}</td>
                  <td style={{ padding: "10px 20px" }}>{b.services}</td>
                  <td style={{ padding: "10px 20px" }}>{mx(b.sales)}</td>
                  <td style={{ padding: "10px 20px" }}>{mx(b.tips)}</td>
                  <td style={{ padding: "10px 20px", fontWeight: 700 }}>{mx(b.commission)}</td>
                </tr>
              ))}
              {Object.values(stats.byBarber).length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: T.slate }}>Sin ventas esta semana.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
        <Panel>
          <SectionTitle>Servicios más vendidos</SectionTitle>
          {topServices.length === 0 && <div style={{ color: T.slate, fontSize: 13 }}>Sin datos aún.</div>}
          {topServices.map(([name, count]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.line}`, fontSize: 13.5 }}>
              <span style={{ fontWeight: 600 }}>{name}</span><span style={{ color: T.slate }}>{count}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
