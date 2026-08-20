import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme";
import { mx } from "../utils/format";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/products";
import { useRealtimeTable } from "../hooks/useRealtimeTable";
import { addBtn, iconBtn, inputStyle, labelStyle, BigButton, Modal, Panel, SectionTitle } from "./ui";

// El control de acceso real vive en App.jsx (solo renderiza esto para
// role === "admin") y en las políticas RLS de Supabase (rechazan
// cualquier escritura en "products" que no venga de un admin).
export default function Productos() {
  return <ProductosAdmin />;
}

function ProductosAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", stock: "", category: "", commissionPct: "" });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setProducts(await getProducts());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtimeTable("products", () => load()); // el inventario baja solo cuando recepción vende un producto

  function openNew() {
    setForm({ name: "", price: "", stock: "", category: "", commissionPct: 10 });
    setSaveError("");
    setEditing("new");
  }
  function openEdit(p) {
    setForm({ name: p.name, price: p.price, stock: p.stock, category: p.category || "", commissionPct: p.commission_pct });
    setSaveError("");
    setEditing(p.id);
  }

  async function save() {
    if (!form.name.trim()) {
      setSaveError("El nombre es obligatorio.");
      return;
    }
    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);
    const commissionNum = Number(form.commissionPct) || 0;
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setSaveError("El precio debe ser un número válido.");
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setSaveError("El stock debe ser un número igual o mayor a 0.");
      return;
    }
    if (commissionNum < 0 || commissionNum > 100) {
      setSaveError("La comisión debe ser un número entre 0 y 100.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: form.name.trim(),
        price: priceNum,
        stock: stockNum,
        category: form.category.trim(),
        commission_pct: commissionNum,
      };
      if (editing === "new") await createProduct(payload);
      else await updateProduct(editing, payload);
      setEditing(null);
      load();
    } catch (e) {
      setSaveError(e.message || "No se pudo guardar. Revisa tu conexión o tus permisos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleteError("");
    setDeletingId(p.id);
    try {
      await deleteProduct(p.id);
      load();
    } catch (e) {
      setDeleteError(
        e.code === "23503"
          ? `No se puede eliminar "${p.name}": ya aparece en ventas registradas. Desactívalo o pon su stock en 0 en vez de eliminarlo.`
          : (e.message || "No se pudo eliminar.")
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function toggle(p) {
    try {
      await updateProduct(p.id, { active: !p.active });
      load();
    } catch (e) {
      alert("No se pudo cambiar el estado: " + e.message);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando…</div>;

  return (
    <div>
      <SectionTitle right={<button onClick={openNew} style={addBtn}><PlusCircle size={16} /> Agregar producto</button>}>
        Productos
      </SectionTitle>

      {deleteError && (
        <div style={{ background: "#FBEAE5", border: `1px solid ${T.red}`, color: T.red, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
          {deleteError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {products.map((p) => (
          <Panel key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>{p.name}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => openEdit(p)} style={iconBtn} title="Editar"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(p)} style={iconBtn} title="Eliminar" disabled={deletingId === p.id}>
                  <Trash2 size={13} color={T.red} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{mx(p.price)}</div>
            <div style={{ fontSize: 12.5, color: T.slate }}>{p.category}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12.5, color: p.stock < 5 ? T.red : T.slate, fontWeight: 600 }}>
              <Package size={13} /> {p.stock} en inventario
              {p.stock < 5 && <AlertTriangle size={13} />}
            </div>
            <div style={{ fontSize: 12, color: T.brassDim, marginTop: 6, fontWeight: 600 }}>
              Comisión al barbero: {p.commission_pct}%
            </div>
            <button onClick={() => toggle(p)} style={{
              marginTop: 10, fontSize: 11.5, fontWeight: 700, color: p.active ? T.green : T.slate,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              {p.active ? "● Activo" : "○ Inactivo"}
            </button>
          </Panel>
        ))}
        {products.length === 0 && (
          <div style={{ color: T.slate, fontSize: 13, gridColumn: "1 / -1" }}>Aún no hay productos registrados.</div>
        )}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "Agregar producto" : "Editar producto"}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Pomada" />

          <label style={labelStyle}>Precio ($)</label>
          <input type="number" min="0" style={inputStyle()} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

          <label style={labelStyle}>Stock</label>
          <input type="number" min="0" style={inputStyle()} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />

          <label style={labelStyle}>Categoría</label>
          <input style={inputStyle()} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Opcional" />

          <label style={labelStyle}>Comisión del barbero por esta venta (%)</label>
          <input type="number" min="0" max="100" style={inputStyle()} value={form.commissionPct} onChange={(e) => setForm({ ...form, commissionPct: e.target.value })} />

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
