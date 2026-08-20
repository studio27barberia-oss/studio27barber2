import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, ShieldAlert, Phone } from "lucide-react";
import { T } from "../lib/theme";
import { mx, weekRangeDates, todayStr } from "../utils/format";
import { getBarbers, createBarber, updateBarber, deleteBarber, toggleBarberActive } from "../services/barbers";
import { useSales } from "../hooks/useSales";
import { useRealtimeTable } from "../hooks/useRealtimeTable";
import { computeStats } from "../services/stats";
import { addBtn, iconBtn, inputStyle, labelStyle, BigButton, Modal, Panel, SectionTitle } from "./ui";

// Solo Administrador. App.jsx ya evita que "recepcion" llegue a esta
// pantalla, pero se valida también aquí adentro (defensa en profundidad):
// nunca confíes solo en ocultar un botón en el router. Los permisos
// reales están además protegidos por Row Level Security en Supabase —
// aunque alguien manipulara el frontend, la base de datos rechaza
// cualquier insert/update/delete en "barbers" que no venga de un admin.
export default function Barberos({ role }) {
  if (role !== "admin") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
        <ShieldAlert size={32} color={T.slate} />
        <div style={{ fontWeight: 800, fontSize: 15, color: T.ink, marginTop: 12 }}>Acceso restringido</div>
        <div style={{ fontSize: 13, color: T.slate, marginTop: 4, maxWidth: 340 }}>
          Solo el perfil de Administrador puede ver y editar barberos.
        </div>
      </div>
    );
  }
  return <BarberosAdmin />;
}

function BarberosAdmin() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // "new" | id del barbero | null
  const [form, setForm] = useState({ name: "", phone: "", commission: 40 });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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
  useRealtimeTable("barbers", () => load()); // si otro dispositivo agrega/edita un barbero, se refresca solo

  function openNew() {
    setForm({ name: "", phone: "", commission: 40 });
    setSaveError("");
    setEditing("new");
  }
  function openEdit(b) {
    setForm({ name: b.name, phone: b.phone || "", commission: b.commission_pct });
    setSaveError("");
    setEditing(b.id);
  }

  async function save() {
    if (!form.name.trim()) {
      setSaveError("El nombre es obligatorio.");
      return;
    }
    const commissionNum = Number(form.commission);
    if (Number.isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      setSaveError("La comisión debe ser un número entre 0 y 100.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (editing === "new") {
        await createBarber({ name: form.name.trim(), phone: form.phone.trim(), commission_pct: commissionNum });
      } else {
        await updateBarber(editing, { name: form.name.trim(), phone: form.phone.trim(), commission_pct: commissionNum });
      }
      setEditing(null);
      load();
    } catch (e) {
      setSaveError(e.message || "No se pudo guardar. Revisa tu conexión o tus permisos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(b) {
    if (!confirm(`¿Eliminar a "${b.name}" definitivamente? Esta acción no se puede deshacer.`)) return;
    setDeleteError("");
    setDeletingId(b.id);
    try {
      await deleteBarber(b.id);
      load();
    } catch (e) {
      setDeleteError(e.message || "No se pudo eliminar.");
    } finally {
      setDeletingId(null);
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
      <SectionTitle right={<button onClick={openNew} style={addBtn}><PlusCircle size={16} /> Agregar barbero</button>}>
        Barberos
      </SectionTitle>

      {deleteError && (
        <div style={{ background: "#FBEAE5", border: `1px solid ${T.red}`, color: T.red, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
          {deleteError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {barbers.map((b) => {
          const s = stats.byBarber[b.id] || { services: 0, tips: 0, commission: 0 };
          const todayTotal = todaySales.filter((sa) => sa.barber_id === b.id).reduce((a, sa) => a + Number(sa.total), 0);
          return (
            <Panel key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.ink, color: T.brass, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                    {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: b.active ? T.green : T.slate, fontWeight: 600 }}>{b.active ? "Activo" : "Inactivo"}</div>
                    {b.phone && (
                      <div style={{ fontSize: 11.5, color: T.slate, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Phone size={11} /> {b.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(b)} style={iconBtn} title="Editar"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(b)} style={iconBtn} title="Eliminar" disabled={deletingId === b.id}>
                    <Trash2 size={14} color={T.red} />
                  </button>
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

              <button onClick={() => toggleActive(b)} style={{
                marginTop: 12, fontSize: 11.5, fontWeight: 700, color: b.active ? T.slate : T.green,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
                {b.active ? "Desactivar" : "Reactivar"}
              </button>
            </Panel>
          );
        })}
        {barbers.length === 0 && (
          <div style={{ color: T.slate, fontSize: 13, gridColumn: "1 / -1" }}>Aún no hay barberos registrados.</div>
        )}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "Agregar barbero" : "Editar barbero"}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />

          <label style={labelStyle}>Teléfono</label>
          <input style={inputStyle()} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Opcional" />

          <label style={labelStyle}>Comisión (%)</label>
          <input type="number" min="0" max="100" style={inputStyle()} value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} />

          <div style={{ fontSize: 11, color: T.slate, marginTop: 6 }}>
            Cambiar la comisión NO afecta ventas ya registradas: cada venta guarda el % que estaba vigente al momento de cobrarla.
          </div>

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
