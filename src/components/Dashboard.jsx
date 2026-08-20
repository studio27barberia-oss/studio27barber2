import React, { useEffect, useMemo, useState } from "react";
import { PlusCircle, CalendarPlus } from "lucide-react";
import { T } from "../lib/theme";
import { DAYS, PAY_METHODS, mx, weekRangeDates, isoWeekday, todayStr } from "../utils/format";
import { useSales } from "../hooks/useSales";
import { getBarbers } from "../services/barbers";
import { createAppointment } from "../services/appointments";
import { Modal, Panel, SectionTitle, inputStyle, labelStyle, BigButton } from "./ui";

// Vista principal de Recepción (iPad).
// - Dos botones grandes: + Nueva venta / + Cita.
// - Nada de cajas de dinero acumulado (eso es información del admin).
// - Abajo, la semana completa (lunes a domingo) con el detalle de cada
//   servicio agrupado por día. No se "borra" nada: simplemente muestra
//   siempre la semana ACTUAL (lunes de hoy → domingo de hoy), así que al
//   llegar un nuevo lunes el rango cambia solo y arranca "vacío" — pero
//   la semana anterior sigue completa y consultable en Historial/Semana
//   dentro del panel de administrador.

function formatDayHeading(dateStr, dayName) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleDateString("es-MX", { month: "long" });
  return `${dayName} ${day} de ${month}`;
}

function NuevaCitaModal({ onClose }) {
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState("");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBarbers().then((b) => setBarbers(b.filter((x) => x.active))).catch(() => {});
  }, []);

  async function save() {
    if (!barberId || !clientName.trim() || !time) {
      setError("Barbero, cliente y hora son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createAppointment({
        barber_id: barberId,
        client_name: clientName.trim(),
        phone: phone.trim(),
        appt_time: time,
      });
      onClose();
    } catch (e) {
      setError(e.message || "No se pudo guardar la cita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Nueva cita">
      <label style={labelStyle}>Barbero</label>
      <select value={barberId} onChange={(e) => setBarberId(e.target.value)} style={inputStyle()}>
        <option value="">Selecciona…</option>
        {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <label style={labelStyle}>Cliente</label>
      <input style={inputStyle()} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />
      <label style={labelStyle}>Teléfono</label>
      <input style={inputStyle()} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" />
      <label style={labelStyle}>Hora</label>
      <input type="time" style={inputStyle()} value={time} onChange={(e) => setTime(e.target.value)} />
      {error && (
        <div style={{ background: "#FBEAE5", border: `1px solid ${T.red}`, color: T.red, borderRadius: 10, padding: "9px 12px", fontSize: 12.5, marginTop: 10, fontWeight: 600 }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <BigButton disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar cita"}</BigButton>
      </div>
    </Modal>
  );
}

export default function Home({ onNavigate }) {
  const dates = weekRangeDates(); // [lunes ... domingo] de la semana actual — se recalcula solo
  const { sales, loading } = useSales({ from: dates[0], to: dates[6] });
  const [showCita, setShowCita] = useState(false);
  const todayIdx = isoWeekday(todayStr());

  const byDay = useMemo(() => {
    const map = {};
    dates.forEach((d) => { map[d] = []; });
    sales.forEach((s) => {
      if (map[s.sale_date]) map[s.sale_date].push(s);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => (a.sale_time || "").localeCompare(b.sale_time || "")));
    return map;
  }, [sales, dates]);

  return (
    <div>
      {/* Botones grandes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <button onClick={() => onNavigate("nueva-venta")} style={{
          background: T.ink, color: T.bone, border: "none", borderRadius: 20, padding: "30px 20px",
          fontSize: 20, fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 12, cursor: "pointer",
        }}>
          <PlusCircle size={36} /> Nueva venta
        </button>
        <button onClick={() => setShowCita(true)} style={{
          background: "#FFFFFF", color: T.ink, border: `2px solid ${T.ink}`, borderRadius: 20, padding: "30px 20px",
          fontSize: 20, fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 12, cursor: "pointer",
        }}>
          <CalendarPlus size={36} /> Cita
        </button>
      </div>

      {/* Tabla semanal, sin totales de dinero */}
      <SectionTitle>Esta semana</SectionTitle>
      {loading && <div style={{ color: T.slate, fontSize: 13, padding: 20 }}>Cargando…</div>}

      {!loading && dates.map((date, i) => {
        const dayName = DAYS[i];
        const rows = byDay[date] || [];
        return (
          <div key={date} style={{ marginBottom: 18 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              fontSize: 13, fontWeight: 800, color: i === todayIdx ? T.brassDim : T.ink,
            }}>
              {formatDayHeading(date, dayName)}
              {i === todayIdx && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "#F2EAD6", color: T.brassDim, padding: "2px 8px", borderRadius: 999 }}>HOY</span>
              )}
            </div>
            <Panel style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bone, textAlign: "left" }}>
                    {["Hora", "Barbero", "Cliente", "Servicio", "Propina", "Total", "Método de pago"].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", color: T.slate, fontWeight: 700, fontSize: 10.5, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${T.line}` }}>
                      <td style={{ padding: "8px 14px" }}>{(s.sale_time || "").slice(0, 5)}</td>
                      <td style={{ padding: "8px 14px", fontWeight: 600 }}>{s.barber_name_snapshot}</td>
                      <td style={{ padding: "8px 14px", color: T.slate }}>{s.client_name_snapshot || "—"}</td>
                      <td style={{ padding: "8px 14px", color: T.slate }}>{(s.sale_items || []).map((sv) => sv.service_name_snapshot).join(", ") || "—"}</td>
                      <td style={{ padding: "8px 14px" }}>{mx(s.tip)}</td>
                      <td style={{ padding: "8px 14px", fontWeight: 700 }}>{mx(s.total)}</td>
                      <td style={{ padding: "8px 14px" }}>{PAY_METHODS.find((m) => m.id === s.payment_method)?.label}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 14, textAlign: "center", color: T.slate, fontSize: 12.5 }}>Sin servicios registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </Panel>
          </div>
        );
      })}

      {showCita && (
        <NuevaCitaModal onClose={() => setShowCita(false)} />
      )}
    </div>
  );
}
