import React, { useState } from "react";
import { Download } from "lucide-react";
import { T } from "../lib/theme";
import { mx } from "../utils/format";
import { getSales } from "../services/sales";
import { computeStats } from "../services/stats";
import { Panel, SectionTitle, StatCard, inputStyle, labelStyle, secondaryBtn } from "./ui";

function toCSV(sales) {
  const header = ["fecha", "hora", "barbero", "servicios", "productos", "subtotal", "propina", "total", "metodo_pago", "comision"];
  const rows = sales.map((s) => [
    s.sale_date, s.sale_time,
    s.barber_name_snapshot,
    (s.sale_items || []).map((i) => i.service_name_snapshot).join(" + "),
    (s.sale_products || []).map((p) => `${p.product_name_snapshot} x${p.qty}`).join(" + "),
    s.subtotal, s.tip, s.total, s.payment_method, s.commission_total,
  ]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reportes() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function run() {
    setLoading(true);
    const data = await getSales({ from, to });
    setSales(data);
    setLoading(false);
    setRan(true);
  }

  const stats = computeStats(sales);
  const total = sales.reduce((a, s) => a + Number(s.total), 0);
  const tips = sales.reduce((a, s) => a + Number(s.tip), 0);
  const commission = sales.reduce((a, s) => a + Number(s.commission_total), 0);

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const rows = sales.map((s) => ({
        Fecha: s.sale_date, Hora: s.sale_time, Barbero: s.barber_name_snapshot,
        Servicios: (s.sale_items || []).map((i) => i.service_name_snapshot).join(" + "),
        Productos: (s.sale_products || []).map((p) => `${p.product_name_snapshot} x${p.qty}`).join(" + "),
        Subtotal: s.subtotal, Propina: s.tip, Total: s.total, Pago: s.payment_method, Comision: s.commission_total,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas");
      XLSX.writeFile(wb, `reporte_${from}_${to}.xlsx`);
    } catch (e) {
      alert('Para exportar a Excel instala la librería: npm install xlsx');
    }
  }

  async function exportPDF() {
    try {
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF();
      doc.text(`Reporte de ventas ${from} a ${to}`, 14, 14);
      doc.autoTable({
        startY: 20,
        head: [["Fecha", "Barbero", "Total", "Comisión", "Pago"]],
        body: sales.map((s) => [s.sale_date, s.barber_name_snapshot, mx(s.total), mx(s.commission_total), s.payment_method]),
      });
      doc.save(`reporte_${from}_${to}.pdf`);
    } catch (e) {
      alert('Para exportar a PDF instala las librerías: npm install jspdf jspdf-autotable');
    }
  }

  return (
    <div>
      <SectionTitle>Reportes</SectionTitle>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div><label style={labelStyle}>Desde</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle()} /></div>
        <div><label style={labelStyle}>Hasta</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle()} /></div>
        <button onClick={run} style={{ ...secondaryBtn, width: 160 }} disabled={loading}>{loading ? "Consultando…" : "Generar reporte"}</button>
      </div>

      {ran && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <button onClick={() => downloadFile(toCSV(sales), `reporte_${from}_${to}.csv`, "text/csv")} style={{ ...secondaryBtn, width: 160 }}>
              <Download size={15} /> CSV
            </button>
            <button onClick={exportExcel} style={{ ...secondaryBtn, width: 160 }}><Download size={15} /> Excel</button>
            <button onClick={exportPDF} style={{ ...secondaryBtn, width: 160 }}><Download size={15} /> PDF</button>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Ventas" value={mx(total)} />
            <StatCard label="Servicios" value={sales.length} />
            <StatCard label="Propinas" value={mx(tips)} />
            <StatCard label="Comisiones" value={mx(commission)} />
            <StatCard label="Efectivo" value={mx(stats.byMethod.efectivo)} />
            <StatCard label="Tarjeta" value={mx(stats.byMethod.tarjeta)} />
            <StatCard label="Transferencia" value={mx(stats.byMethod.transferencia)} />
          </div>

          <Panel>
            <SectionTitle>Ventas por barbero</SectionTitle>
            {Object.values(stats.byBarber).map((b) => (
              <div key={b.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.line}`, fontSize: 13.5 }}>
                <span style={{ fontWeight: 600 }}>{b.name}</span><span>{mx(b.sales)}</span>
              </div>
            ))}
            {Object.values(stats.byBarber).length === 0 && <div style={{ color: T.slate, fontSize: 13 }}>Sin datos en ese rango.</div>}
          </Panel>
        </>
      )}

      <div style={{ fontSize: 12, color: T.slate, marginTop: 16 }}>
        CSV se genera sin dependencias. Excel y PDF necesitan las librerías <code>xlsx</code> y <code>jspdf</code> + <code>jspdf-autotable</code> instaladas (ver README) — si no están instaladas, el botón te avisa en vez de fallar en silencio.
      </div>
    </div>
  );
}
