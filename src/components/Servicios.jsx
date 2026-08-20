import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, Clock, ShieldAlert } from "lucide-react";
import { T } from "../lib/theme";
import { mx } from "../utils/format";
import { getServices, createService, updateService, deleteService } from "../services/catalogServices";
import { useRealtimeTable } from "../hooks/useRealtimeTable";
import { addBtn, iconBtn, inputStyle, labelStyle, BigButton, Modal, Panel, SectionTitle } from "./ui";

// Solo Administrador. Ver la nota de defensa-en-profundidad en Barberos.jsx:
// esta misma verificación existe en el router (App.jsx) y además en
// Supabase (RLS) — aquí es una tercera capa, no la única.
export default function Servicios({ role }) {
  if (role !== "admin") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
        <ShieldAlert size={32} color={T.slate} />
        <div style={{ fontWeight: 800, fontSize: 15, color: T.ink, marginTop: 12 }}>Acceso restringido</div>
        <div style={{ fontSize: 13, color: T.slate, marginTop: 4, maxWidth: 340 }}>
          Solo el perfil de Administrador puede ver y editar servicios.
        </div>
      </div>
    );
  }
  return <ServiciosAdmin />;
}

function ServiciosAdmin() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setServices(await getServices());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtimeTable("services", () => load());

  function openNew() {
    setForm({ name: "", price: "", duration: "" });
    setSaveError("");
    setEditing("new");
  }
  function openEdit(s) {
    setForm({ name: s.name, price: s.price, duration: s.duration_minutes });
    setSaveError("");
    setEditing(s.id);
  }

  async function save() {
    if (!form.name.trim()) {
      setSaveError("El nombre es obligatorio.");
      return;
    }
    const priceNum = Number(form.price);
    const durationNum = Number(form.duration);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setSaveError("El precio debe ser un número válido.");
      return;
    }
    if (Number.isNaN(durationNum) || durationNum <= 0) {
      setSaveError("La duración debe ser un número de minutos mayor a 0.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (editing === "new") {
        await createService({ name: form.name.trim(), price: priceNum, duration_minutes: durationNum });
      } else {
        await updateService(editing, { name: form.name.trim(), price: priceNum, duration_minutes: durationNum });
      }
      setEditing(null);
      load();
    } catch (e) {
      setSaveError(e.message || "No se pudo guardar. Revisa tu conexión o tus permisos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s) {
    if (!confirm(`¿Eliminar el servicio "${s.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleteError("");
    setDeletingId(s.id);
    try {
      await deleteService(s.id);
      load();
    } catch (e) {
      setDeleteError(
        e.code === "23503"
          ? `No se puede eliminar "${s.name}": ya aparece en ventas registradas. Desactívalo en vez de eliminarlo para conservar el historial.`
          : (e.message || "No se pudo eliminar.")
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function toggle(s) {
    try {
      await updateService(s.id, { active: !s.active });
      load();
    } catch (e) {
      alert("No se pudo cambiar el estado: " + e.message);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando…</div>;

  return (
    <div>
      <SectionTitle right={<button onClick={openNew} style={addBtn}><PlusCircle size={16} /> Agregar servicio</button>}>
        Servicios
      </SectionTitle>

      {deleteError && (
        <div style={{ background: "#FBEAE5", border: `1px solid ${T.red}`, color: T.red, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
          {deleteError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {services.map((s) => (
          <Panel key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>{s.name}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => openEdit(s)} style={iconBtn} title="Editar"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(s)} style={iconBtn} title="Eliminar" disabled={deletingId === s.id}>
                  <Trash2 size={13} color={T.red} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{mx(s.price)}</div>
            <div style={{ fontSize: 12.5, color: T.slate, display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} /> {s.duration_minutes} min
            </div>
            <button onClick={() => toggle(s)} style={{
              marginTop: 10, fontSize: 11.5, fontWeight: 700, color: s.active ? T.green : T.slate,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              {s.active ? "● Activo" : "○ Inactivo"}
            </button>
          </Panel>
        ))}
        {services.length === 0 && (
          <div style={{ color: T.slate, fontSize: 13, gridColumn: "1 / -1" }}>Aún no hay servicios registrados.</div>
        )}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "Agregar servicio" : "Editar servicio"}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Corte de cabello" />

          <label style={labelStyle}>Precio ($)</label>
          <input type="number" min="0" style={inputStyle()} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

          <label style={labelStyle}>Duración (minutos)</label>
          <input type="number" min="1" style={inputStyle()} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />

          {saveError && (
            <div style={{ background: "#FBEAE5", border: `1px solid ${T.red}`, color: T.red, borderRadius: 10, padding: "9px 12px", fontSize: 12.5, marginTop: 10, fontWeight: 600 }}>
              {saveError}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <BigButton disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar"}</BigButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
