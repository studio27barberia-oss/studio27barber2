import React, { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { T } from "../lib/theme";
import { PAY_METHODS, mx } from "../utils/format";
import { getSales } from "../services/sales";
import { getBarbers } from "../services/barbers";
import { getServices } from "../services/catalogServices";
import { Panel, SectionTitle, StatCard, inputStyle, labelStyle } from "./ui";

// Consulta directa al historial COMPLETO de ventas (nunca se borra).
// "Hoy" / "Semana" / "Mes" son solo atajos de este mismo filtro por fecha;
// aquí el administrador puede ir tan atrás como quiera.
export default function Historial() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [barberId, setBarberId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getBarbers(), getServices()]).then(([b, s]) => {
      setBarbers(b);
      setServices(s);
    }).catch(() => {});
  }, []);

  async function runQuery() {
    setLoading(true);
    setError("");
    try {
      const data = await getSales({
        from, to,
        barberId: barberId || undefined,
        paymentMethod: paymentMethod || undefined,
        serviceId: serviceId || undefined,
      });
      setSales(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { runQuery(); /* carga inicial */ }, []); // eslint-disable-line

  const total = sales.reduce((a, s) => a + Number(s.total), 0);
  const commission = sales.reduce((a, s) => a + Number(s.commission_total), 0);
  const tips = sales.reduce((a, s) => a + Number(s.tip), 0);

  return (
    <div>
      <SectionTitle right={<span style={{ fontSize: 11.5, color: T.slate, display: "flex", alignItems: "center", gap: 6 }}><Archive size={13} /> Registro permanente — nada se borra</span>}>
        Historial
      </SectionTitle>

      <Panel style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <div>
            <label style={labelStyle}>Fecha inicial</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle()} />
          </div>
          <div>
            <label style={labelStyle}>Fecha final</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle()} />
          </div>
          <div>
            <label style={labelStyle}>Barbero</label>
            <select value={barberId} onChange={(e) => setBarberId(e.target.value)} style={inputStyle()}>
              <option value="">Todos</option>
              {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Método de pago</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle()}>
              <option value="">Todos</option>
              {PAY_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Servicio</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle()}>
              <option value="">Todos</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={runQuery} style={{
          marginTop: 14, background: T.ink, color: T.bone, border: "none", borderRadius: 10,
          padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          Consultar
        </button>
      </Panel>

      {error && <div style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Ventas en el rango" value={sales.length} />
        <StatCard label="Total" value={mx(total)} />
        <StatCard label="Comisiones" value={mx(commission)} />
        <StatCard label="Propinas" value={mx(tips)} />
      </div>

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: T.bone, textAlign: "left" }}>
              {["Fecha", "Hora", "Barbero", "Servicios", "Total", "Comisión", "Pago"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", color: T.slate, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: T.slate }}>Consultando…</td></tr>}
            {!loading && sales.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td style={{ padding: "10px 14px" }}>{s.sale_date}</td>
                <td style={{ padding: "10px 14px" }}>{(s.sale_time || "").slice(0, 5)}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.barber_name_snapshot}</td>
                <td style={{ padding: "10px 14px", color: T.slate }}>{(s.sale_items || []).map((sv) => sv.service_name_snapshot).join(", ")}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700 }}>{mx(s.total)}</td>
                <td style={{ padding: "10px 14px" }}>{mx(s.commission_total)}</td>
                <td style={{ padding: "10px 14px" }}>{PAY_METHODS.find((m) => m.id === s.payment_method)?.label}</td>
              </tr>
            ))}
            {!loading && sales.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: T.slate }}>No hay ventas en ese rango con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
