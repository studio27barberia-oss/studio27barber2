import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme";
import { mx } from "../utils/format";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/products";
import { useRealtimeTable } from "../hooks/useRealtimeTable";
import { addBtn, iconBtn, inputStyle, labelStyle, BigButton, Modal, Panel, SectionTitle } from "./ui";

export default function Productos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", stock: "", category: "", commissionPct: "" });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() { setLoading(true); setProducts(await getProducts()); setLoading(false); }
  useEffect(() => { load(); }, []);
  useRealtimeTable("products", () => load()); // el inventario baja solo cuando recepción vende un producto

  function openNew() { setForm({ name: "", price: "", stock: "", category: "", commissionPct: 10 }); setSaveError(""); setEditing("new"); }
  function openEdit(p) { setForm({ name: p.name, price: p.price, stock: p.stock, category: p.category || "", commissionPct: p.commission_pct }); setSaveError(""); setEditing(p.id); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = { name: form.name, price: Number(form.price), stock: Number(form.stock), category: form.category, commission_pct: Number(form.commissionPct) || 0 };
      if (editing === "new") await createProduct(payload);
      else await updateProduct(editing, payload);
      setEditing(null); load();
    } catch (e) {
      setSaveError(e.message || "No se pudo guardar. Revisa tu conexión o tus permisos.");
    } finally {
      setSaving(false);
    }
  }
  async function remove(id) {
    try {
      await deleteProduct(id); load();
    } catch (e) {
      alert("No se pudo eliminar: " + e.message);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando…</div>;

  return (
    <div>
      <SectionTitle right={<button onClick={openNew} style={addBtn}><PlusCircle size={16} /> Agregar producto</button>}>Productos</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {products.map((p) => (
          <Panel key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>{p.name}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => openEdit(p)} style={iconBtn}><Pencil size={13} /></button>
                <button onClick={() => remove(p.id)} style={iconBtn}><Trash2 size={13} /></button>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{mx(p.price)}</div>
            <div style={{ fontSize: 12.5, color: T.slate }}>{p.category}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12.5, color: p.stock < 5 ? T.red : T.slate, fontWeight: 600 }}>
              <Package size={13} /> {p.stock} en inventario {p.stock < 5 && <AlertTriangle size={13} />}
            </div>
            <div style={{ fontSize: 12, color: T.brassDim, marginTop: 6, fontWeight: 600 }}>Comisión al barbero: {p.commission_pct}%</div>
          </Panel>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "Agregar producto" : "Editar producto"}>
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label style={labelStyle}>Precio</label>
          <input type="number" style={inputStyle()} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <label style={labelStyle}>Inventario</label>
          <input type="number" style={inputStyle()} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <label style={labelStyle}>Categoría</label>
          <input style={inputStyle()} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label style={labelStyle}>Comisión del barbero por esta venta (%)</label>
          <input type="number" style={inputStyle()} value={form.commissionPct} onChange={(e) => setForm({ ...form, commissionPct: e.target.value })} />
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
