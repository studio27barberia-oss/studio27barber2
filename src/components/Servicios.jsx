import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, Clock } from "lucide-react";
import { T } from "../lib/theme";
import { mx } from "../utils/format";
import { getServices, createService, updateService, deleteService } from "../services/catalogServices";
import { useRealtimeTable } from "../hooks/useRealtimeTable";
import { addBtn, iconBtn, inputStyle, labelStyle, BigButton, Modal, Panel, SectionTitle } from "./ui";

export default function Servicios() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() { setLoading(true); setServices(await getServices()); setLoading(false); }
  useEffect(() => { load(); }, []);
  useRealtimeTable("services", () => load());

  function openNew() { setForm({ name: "", price: "", duration: "" }); setSaveError(""); setEditing("new"); }
  function openEdit(s) { setForm({ name: s.name, price: s.price, duration: s.duration_minutes }); setSaveError(""); setEditing(s.id); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editing === "new") {
        await createService({ name: form.name, price: Number(form.price), duration_minutes: Number(form.duration) });
      } else {
        await updateService(editing, { name: form.name, price: Number(form.price), duration_minutes: Number(form.duration) });
      }
      setEditing(null); load();
    } catch (e) {
      setSaveError(e.message || "No se pudo guardar. Revisa tu conexión o tus permisos.");
    } finally {
      setSaving(false);
    }
  }
  async function remove(id) {
    try { await deleteService(id); load(); }
    catch (e) { alert("No se pudo eliminar: " + e.message); }
  }
  async function toggle(s) {
    try { await updateService(s.id, { active: !s.active }); load(); }
    catch (e) { alert("No se pudo cambiar el estado: " + e.message); }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando…</div>;

  return (
    <div>
      <SectionTitle right={<button onClick={openNew} style={addBtn}><PlusCircle size={16} /> Agregar servicio</button>}>Servicios</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {services.map((s) => (
          <Panel key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>{s.name}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => openEdit(s)} style={iconBtn}><Pencil size={13} /></button>
                <button onClick={() => remove(s.id)} style={iconBtn}><Trash2 size={13} /></button>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{mx(s.price)}</div>
            <div style={{ fontSize: 12.5, color: T.slate, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {s.duration_minutes} min</div>
            <button onClick={() => toggle(s)} style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, color: s.active ? T.green : T.slate, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {s.active ? "● Activo" : "○ Inactivo"}
            </button>
          </Panel>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "Agregar servicio" : "Editar servicio"}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label style={labelStyle}>Precio</label>
          <input type="number" style={inputStyle()} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <label style={labelStyle}>Duración (min)</label>
          <input type="number" style={inputStyle()} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
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
