import React, { useEffect, useState } from "react";
import { PlusCircle, Search, Star } from "lucide-react";
import { T } from "../lib/theme";
import { mx } from "../utils/format";
import { getClients, createClient, searchClients } from "../services/clients";
import { useRealtimeTable } from "../hooks/useRealtimeTable";
import { addBtn, inputStyle, labelStyle, BigButton, Modal, Panel, SectionTitle } from "./ui";

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  async function load() { setLoading(true); setClients(await getClients()); setLoading(false); }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (search.trim()) setClients(await searchClients(search.trim()));
      else load();
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  // Si otro dispositivo crea/actualiza un cliente (por ejemplo al registrar
  // una venta), refresca respetando la búsqueda activa en pantalla.
  useRealtimeTable("clients", async () => {
    if (search.trim()) setClients(await searchClients(search.trim()));
    else load();
  });

  async function save() {
    if (!form.name.trim()) return;
    await createClient({ name: form.name, phone: form.phone });
    setAdding(false); setForm({ name: "", phone: "" }); load();
  }

  return (
    <div>
      <SectionTitle right={<button onClick={() => setAdding(true)} style={addBtn}><PlusCircle size={16} /> Nuevo cliente</button>}>Clientes</SectionTitle>
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: 13, color: T.slate }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono…" style={inputStyle(true)} />
      </div>
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: T.bone, textAlign: "left" }}>
              {["Cliente", "Teléfono", "Visitas", "Última visita", "Total gastado"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", color: T.slate, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: T.slate }}>Cargando…</td></tr>}
            {!loading && clients.map((c) => (
              <tr key={c.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td style={{ padding: "10px 16px", fontWeight: 700 }}>{c.name} {c.visits > 5 && <Star size={12} color={T.brass} style={{ display: "inline", marginLeft: 4 }} />}</td>
                <td style={{ padding: "10px 16px", color: T.slate }}>{c.phone || "—"}</td>
                <td style={{ padding: "10px 16px" }}>{c.visits}</td>
                <td style={{ padding: "10px 16px" }}>{c.last_visit || "—"}</td>
                <td style={{ padding: "10px 16px", fontWeight: 700 }}>{mx(c.total_spent)}</td>
              </tr>
            ))}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: T.slate }}>Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
      {adding && (
        <Modal onClose={() => setAdding(false)} title="Nuevo cliente">
          <label style={labelStyle}>Nombre</label>
          <input style={inputStyle()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label style={labelStyle}>Teléfono</label>
          <input style={inputStyle()} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div style={{ marginTop: 16 }}><BigButton onClick={save}>Guardar</BigButton></div>
        </Modal>
      )}
    </div>
  );
}
