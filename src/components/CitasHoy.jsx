import React, { useEffect, useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { T } from "../lib/theme";
import { getBarbers } from "../services/barbers";
import { getAppointmentsToday, createAppointment, deleteAppointment, subscribeToAppointments } from "../services/appointments";
import { addBtn, iconBtn, inputStyle, Panel, SectionTitle } from "./ui";

export default function CitasHoy() {
  const [barbers, setBarbers] = useState([]);
  const [appts, setAppts] = useState([]);
  const [form, setForm] = useState({ barberId: "", clientName: "", phone: "", time: "" });

  async function loadAppts() {
    setAppts(await getAppointmentsToday());
  }

  useEffect(() => {
    getBarbers().then((b) => setBarbers(b.filter((x) => x.active)));
    loadAppts();
    const unsubscribe = subscribeToAppointments(loadAppts);
    return unsubscribe;
  }, []);

  async function addAppointment() {
    if (!form.clientName.trim() || !form.time) return;
    await createAppointment({
      barber_id: form.barberId || null,
      client_name: form.clientName.trim(),
      phone: form.phone.trim(),
      appt_time: form.time,
    });
    setForm({ ...form, clientName: "", phone: "", time: "" });
    loadAppts();
  }

  async function removeAppointment(id) {
    await deleteAppointment(id);
    loadAppts();
  }

  const sorted = [...appts].sort((a, b) => (a.appt_time || "").localeCompare(b.appt_time || ""));

  return (
    <Panel>
      <SectionTitle>Citas de hoy</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} style={inputStyle()}>
          <option value="">Barbero</option>
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={inputStyle()} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <input placeholder="Nombre del cliente" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} style={inputStyle()} />
        <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle()} />
      </div>
      <button onClick={addAppointment} style={addBtn}><PlusCircle size={15} /> Agregar cita</button>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {sorted.length === 0 && <div style={{ fontSize: 13, color: T.slate }}>Sin citas registradas para hoy.</div>}
        {sorted.map((a) => {
          const barberName = barbers.find((b) => b.id === a.barber_id)?.name || "Sin asignar";
          return (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{(a.appt_time || "").slice(0, 5)} · {a.client_name}</div>
                <div style={{ fontSize: 11.5, color: T.slate }}>{barberName}{a.phone ? ` · ${a.phone}` : ""}</div>
              </div>
              <button onClick={() => removeAppointment(a.id)} style={iconBtn}><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
