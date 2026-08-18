import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, LogOut } from "lucide-react";
import { T } from "../lib/theme";
import { mx, weekRangeDates, todayStr } from "../utils/format";
import { getBarbers, createBarber, updateBarber, toggleBarberActive } from "../services/barbers";
import { useSales } from "../hooks/useSales";
import { useRealtimeTable } from "../hooks/useRealtimeTable";
import { computeStats } from "../services/stats";
import { addBtn, iconBtn, inputStyle, labelStyle, BigButton, Modal, Panel, SectionTitle } from "./ui";

export default function Barberos() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", commission: 40 });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const dates = weekRangeDates();
  const { sales } = useSales({ from: dates[0], to: dates[6] });
  const stats = computeStats(sales);
  const todaySales = sales.filter((s) => s.sale_date === todayStr());

  async function load() {
    setLoading(true);
    setBarbers(await getBarbers());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtimeTable("barbers", () => load()); // se refresca solo si otro dispositivo edita/agrega un barbero

  function openNew() { setForm({ name: "", commission: 40 }); setSaveError(""); setEditing("new"); }
  function openEdit(b) { setForm({ name: b.name, commission: b.commission_pct }); setSaveError(""); setEditing(b.id); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editing === "new") {
        await createBarber({ name: form.name, commission_pct: Number(form.commission) });
      } else {
        await updateBarber(editing, { name: form.name, commission_pct: Number(form.commission) });
      }
      setEditing(null);
      load();
    } catch (e) {
      setSaveError(e.message || "No se pudo guardar. Revisa tu conexión o tus permisos.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b) {
    try {
      await toggleBarberActive(b.id, !b.active);
      load();
    } catch (e) {
      alert("No se pudo cambiar el estado: " + e.message);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando…</div>;

  return (
    <div>
      <SectionTitle right={<button onClick={openNew} style={addBtn}><PlusCircle size={16} /> Agregar barbero</button>}>Barberos</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {barbers.map((b) => {
          const s = stats.byBarber[b.id] || { services: 0, tips: 0, commission: 0 };
          const todayTotal = todaySales.filter((sa) => sa.barber_id === b.id).reduce((a, sa) => a + Number(sa.total), 0);
          return (
            <Panel key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.ink, color: T.brass, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                    {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: b.active ? T.green : T.slate, fontWeight: 600 }}>{b.active ? "Activo" : "Inactivo"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(b)} style={iconBtn}><Pencil size={14} /></button>
                  <button onClick={() => toggleActive(b)} style={iconBtn}><LogOut size={14} /></button>
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: T.slate }}>Comisión</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{b.commission_pct}%</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, fontSize: 12.5 }}>
                <div><div style={{ color: T.slate }}>Hoy</div><div style={{ fontWeight: 700 }}>{mx(todayTotal)}</div></div>
                <div><div style={{ color: T.slate }}>Servicios (semana)</div><div style={{ fontWeight: 700 }}>{s.services}</div></div>
                <div><div style={{ color: T.slate }}>Propinas</div><div style={{ fontWeight: 700 }}>{mx(s.tips)}</div></div>
                <div><div style={{ color: T.slate }}>Comisión generada</div><div style={{ fontWeight: 700 }}>{mx(s.commission)}</div></div>
              </div>
            </Panel>
          );
        })}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "Agregar barbero" : "Editar barbero"}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label style={labelStyle}>Comisión (%)</label>
          <input type="number" style={inputStyle()} value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} />
          <div style={{ fontSize: 11, color: T.slate, marginTop: 6 }}>
            Cambiar esto NO afecta ventas ya registradas: cada venta guarda el % que estaba vigente al momento de cobrarla.
          </div>
          {saveError && (
            <div style={{ background: "#FBEAE5", border: `1px solid ${T.red}`, color: T.red, borderRadius: 10, padding: "9px 12px", fontSize: 12.5, marginTop: 10, fontWeight: 600 }}>
              {saveError}
            </div>
          )}
          <div style={{ marginTop: 16 }}><BigButton disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar"}</BigButton></div>
        </Modal>
      )}
    </div>
  );
}
