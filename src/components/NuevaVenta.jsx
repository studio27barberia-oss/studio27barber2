import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ArrowRight, PlusCircle } from "lucide-react";
import { T } from "../lib/theme";
import { PAY_METHODS, TIP_PRESETS, mx, todayStr, toLocalTimeStr } from "../utils/format";
import { getBarbers } from "../services/barbers";
import { getServices } from "../services/catalogServices";
import { getProducts } from "../services/products";
import { createSale } from "../services/sales";
import { BigButton, Panel, Pill, Row, SectionTitle, cardBtnStyle, inputStyle, qtyBtn, secondaryBtn } from "./ui";

export default function NuevaVenta({ onDone, fixedBarberId, fixedBarberName }) {
  const [step, setStep] = useState(0);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [barberId, setBarberId] = useState(fixedBarberId || null);
  const [serviceIds, setServiceIds] = useState([]);
  const [productSel, setProductSel] = useState({});
  const [tipMode, setTipMode] = useState(10);
  const [customTip, setCustomTip] = useState("");
  const [payMethod, setPayMethod] = useState(null);
  const [justSaved, setJustSaved] = useState(null); // { total, barberName }

  // Si viene un barbero fijo (perfil de barbero: solo puede vender a su
  // propio nombre), se salta el paso de "elegir barbero" por completo.
  const stepKeys = fixedBarberId
    ? ["servicios", "productos", "propina", "pago", "confirmar"]
    : ["barbero", "servicios", "productos", "propina", "pago", "confirmar"];
  const stepLabels = { barbero: "Barbero", servicios: "Servicios", productos: "Productos", propina: "Propina", pago: "Pago", confirmar: "Confirmar" };
  const steps = stepKeys.map((k) => stepLabels[k]);
  const current = stepKeys[step];
  const lastStep = stepKeys.length - 1;

  useEffect(() => {
    (async () => {
      try {
        const [b, s, p] = await Promise.all([getBarbers(), getServices(), getProducts()]);
        setBarbers(b.filter((x) => x.active));
        setServices(s.filter((x) => x.active));
        setProducts(p.filter((x) => x.active));
      } catch (e) {
        setSaveError("No se pudo cargar el catálogo: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const selectedProducts = useMemo(() => Object.entries(productSel)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ ...products.find((p) => p.id === id), qty }))
    .filter((p) => p.id), [productSel, products]);

  const subtotal = selectedServices.reduce((a, s) => a + Number(s.price), 0) + selectedProducts.reduce((a, p) => a + Number(p.price) * p.qty, 0);
  const tip = tipMode === "custom" ? Number(customTip) || 0 : Math.round(subtotal * (tipMode / 100));
  const total = subtotal + tip;
  const barber = fixedBarberId
    ? (barbers.find((b) => b.id === fixedBarberId) || { id: fixedBarberId, name: fixedBarberName })
    : barbers.find((b) => b.id === barberId);

  function canNext() {
    if (current === "barbero") return !!barberId;
    if (current === "servicios") return serviceIds.length > 0;
    if (current === "pago") return !!payMethod;
    return true;
  }

  async function confirmSale() {
    setSaving(true);
    setSaveError("");
    try {
      await createSale({
        barber_id: fixedBarberId || barberId,
        client_id: null,
        client_name: null,
        tip,
        payment_method: payMethod,
        services: selectedServices.map((s) => ({ id: s.id })),
        products: selectedProducts.map((p) => ({ id: p.id, qty: p.qty })),
        // Fecha y hora LOCALES del dispositivo (no UTC). El servidor usa
        // exactamente estos valores en vez de calcular la hora del
        // servidor, para que la venta caiga siempre en el día correcto
        // sin importar la zona horaria de Supabase.
        sale_date: todayStr(),
        sale_time: toLocalTimeStr(new Date()),
      });
      setJustSaved({ total, barberName: barber?.name });
    } catch (e) {
      setSaveError(e.message || "No se pudo registrar la venta.");
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    setStep(0); setBarberId(fixedBarberId || null); setServiceIds([]); setProductSel({});
    setTipMode(10); setCustomTip(""); setPayMethod(null); setJustSaved(null); setSaveError("");
    // recargar productos por si el inventario cambió
    getProducts().then((p) => setProducts(p.filter((x) => x.active))).catch(() => {});
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: T.slate }}>Cargando catálogo…</div>;
  }

  if (justSaved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", gap: 18 }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={44} color="#fff" />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: T.ink }}>¡Venta registrada!</div>
        <div style={{ fontSize: 15, color: T.slate }}>{mx(justSaved.total)} · {justSaved.barberName}</div>
        <div style={{ width: 280, marginTop: 10 }}>
          <BigButton icon={PlusCircle} onClick={resetAll}>Nueva venta</BigButton>
        </div>
        <button onClick={onDone} style={{ background: "none", border: "none", color: T.slate, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>{fixedBarberName ? `Nueva venta — ${fixedBarberName}` : "Nueva venta"}</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 4, background: i <= step ? T.brass : T.line, marginBottom: 6 }} />
            <div style={{ fontSize: 10.5, color: i === step ? T.ink : T.slate, fontWeight: i === step ? 700 : 500 }}>{s}</div>
          </div>
        ))}
      </div>

      {saveError && (
        <div style={{ background: "#FBEAE5", border: `1px solid ${T.red}`, color: T.red, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
          {saveError}
        </div>
      )}

      <Panel style={{ minHeight: 320 }}>
        {current === "barbero" && (
          <div style={{ maxWidth: 360 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
              Barbero (obligatorio)
            </label>
            <select
              value={barberId || ""}
              onChange={(e) => setBarberId(e.target.value || null)}
              style={{
                width: "100%", padding: "16px 14px", borderRadius: 12, border: `1.5px solid ${barberId ? T.ink : T.line}`,
                fontSize: 16, fontWeight: 700, outline: "none", background: barberId ? "#F2EAD6" : "#FAF6EE", color: T.ink,
                appearance: "none", WebkitAppearance: "none", cursor: "pointer",
              }}
            >
              <option value="">Selecciona un barbero…</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {barbers.length === 0 && <div style={{ color: T.slate, fontSize: 13, marginTop: 10 }}>No hay barberos activos configurados.</div>}
          </div>
        )}

        {current === "servicios" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
            {services.map((s) => {
              const on = serviceIds.includes(s.id);
              return (
                <button key={s.id} onClick={() => setServiceIds(on ? serviceIds.filter((x) => x !== s.id) : [...serviceIds, s.id])}
                  style={cardBtnStyle(on)}>
                  <div style={{ textAlign: "left", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</span>
                      {on && <Check size={16} color={T.brass} />}
                    </div>
                    <div style={{ fontSize: 12, color: T.slate, marginTop: 2 }}>{mx(s.price)} · {s.duration_minutes} min</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {current === "productos" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
            {products.map((p) => {
              const qty = productSel[p.id] || 0;
              return (
                <div key={p.id} style={{ ...cardBtnStyle(qty > 0), flexDirection: "column", alignItems: "stretch", cursor: "default" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: T.slate }}>{mx(p.price)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: p.stock < 5 ? T.red : T.slate, marginTop: 2 }}>Existencia: {p.stock}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <button onClick={() => setProductSel({ ...productSel, [p.id]: Math.max(0, qty - 1) })} style={qtyBtn}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{qty}</span>
                    <button onClick={() => setProductSel({ ...productSel, [p.id]: Math.min(p.stock, qty + 1) })} style={qtyBtn}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {current === "propina" && (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {TIP_PRESETS.map((p) => (
                <Pill key={p} active={tipMode === p} onClick={() => { setTipMode(p); setCustomTip(""); }}>{p}%</Pill>
              ))}
              <Pill active={tipMode === "custom"} onClick={() => setTipMode("custom")}>Otra cantidad</Pill>
            </div>
            {tipMode === "custom" && (
              <input type="number" value={customTip} onChange={(e) => setCustomTip(e.target.value)}
                placeholder="Cantidad de propina" style={inputStyle()} />
            )}
            <div style={{ marginTop: 16, fontSize: 14, color: T.slate }}>Propina calculada: <b style={{ color: T.ink }}>{mx(tip)}</b></div>
          </div>
        )}

        {current === "pago" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 10 }}>
            {PAY_METHODS.map((m) => (
              <button key={m.id} onClick={() => setPayMethod(m.id)} style={cardBtnStyle(payMethod === m.id)}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {current === "confirmar" && (
          <div>
            <div style={{ fontSize: 13, color: T.slate, marginBottom: 4 }}>Barbero</div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>{barber?.name}</div>
            <div style={{ borderTop: `1px dashed ${T.line}`, paddingTop: 12 }}>
              {selectedServices.map((s) => <Row key={s.id} label={s.name} value={mx(s.price)} />)}
              {selectedProducts.map((p) => <Row key={p.id} label={`${p.name} ×${p.qty}`} value={mx(p.price * p.qty)} />)}
              <Row label="Propina" value={mx(tip)} />
              <div style={{ borderTop: `1px solid ${T.line}`, marginTop: 8, paddingTop: 8 }}>
                <Row bold label="Total" value={mx(total)} />
              </div>
              <div style={{ fontSize: 12, color: T.slate, marginTop: 6 }}>
                Método de pago: <b style={{ color: T.ink }}>{PAY_METHODS.find((m) => m.id === payMethod)?.label}</b>
              </div>
            </div>
          </div>
        )}
      </Panel>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ ...secondaryBtn, width: 120 }} disabled={saving}>
            <ChevronLeft size={16} /> Atrás
          </button>
        )}
        {step < lastStep && (
          <div style={{ flex: 1 }}>
            <BigButton disabled={!canNext()} onClick={() => setStep(step + 1)}>
              Continuar <ArrowRight size={18} />
            </BigButton>
          </div>
        )}
        {step === lastStep && (
          <div style={{ flex: 1 }}>
            <BigButton disabled={saving} onClick={confirmSale}>
              {saving ? "Guardando…" : "Cobrar / Guardar venta"}
            </BigButton>
          </div>
        )}
      </div>
    </div>
  );
}
