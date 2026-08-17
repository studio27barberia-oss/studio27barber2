import React, { useState } from "react";
import {
  Home, PlusCircle, Wallet, Calendar, Users, LayoutDashboard, BarChart3,
  Star, Package, Scissors, Archive, UserCircle2, LogOut,
} from "lucide-react";
import { T } from "./lib/theme";
import { useAuth } from "./hooks/useAuth";
import { signOut } from "./services/auth";
import Login from "./components/Login";
import NuevaVenta from "./components/NuevaVenta";
import VentasDelDia from "./components/VentasDelDia";
import Semana from "./components/Semana";
import Dashboard from "./components/Dashboard";
import Barberos from "./components/Barberos";
import Servicios from "./components/Servicios";
import Productos from "./components/Productos";
import Clientes from "./components/Clientes";
import Reportes from "./components/Reportes";
import Historial from "./components/Historial";
import CitasHoy from "./components/CitasHoy";
import { BigButton } from "./components/ui";

const RECEPTION_NAV = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "nueva-venta", label: "Nueva venta", icon: PlusCircle },
  { id: "ventas-dia", label: "Ventas del día", icon: Wallet },
  { id: "clientes", label: "Clientes", icon: Users },
];
const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "semana", label: "Semana", icon: Calendar },
  { id: "ventas-dia", label: "Ventas del día", icon: Wallet },
  { id: "historial", label: "Historial", icon: Archive },
  { id: "barberos", label: "Barberos", icon: Scissors },
  { id: "servicios", label: "Servicios", icon: Star },
  { id: "productos", label: "Productos", icon: Package },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "reportes", label: "Reportes", icon: BarChart3 },
];
const BARBER_NAV = [
  { id: "inicio", label: "Inicio", icon: Home },
];

export default function App() {
  const { session, profile, role, loading } = useAuth();
  const [view, setView] = useState(null);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: T.slate, fontFamily: "system-ui" }}>Cargando…</div>;
  }
  if (!session) return <Login />;
  if (!profile) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: T.slate, fontFamily: "system-ui", textAlign: "center", padding: 20 }}>
        Tu cuenta no tiene un perfil/rol asignado todavía.<br />
        Pide al administrador que te agregue en la tabla <code>profiles</code> de Supabase.
      </div>
    );
  }

  const nav = role === "admin" ? ADMIN_NAV : role === "recepcion" ? RECEPTION_NAV : BARBER_NAV;
  const currentView = view || (role === "admin" ? "dashboard" : "inicio");

  function renderView() {
    if (currentView === "nueva-venta" && role !== "barbero") return <NuevaVenta onDone={() => setView("inicio")} />;
    if (currentView === "ventas-dia") return <VentasDelDia />;
    if (currentView === "clientes" && role !== "barbero") return <Clientes />;
    if (currentView === "dashboard" && role === "admin") return <Dashboard />;
    if (currentView === "semana" && role === "admin") return <Semana />;
    if (currentView === "historial" && role === "admin") return <Historial />;
    if (currentView === "barberos" && role === "admin") return <Barberos />;
    if (currentView === "servicios" && role === "admin") return <Servicios />;
    if (currentView === "productos" && role === "admin") return <Productos />;
    if (currentView === "reportes" && role === "admin") return <Reportes />;
    if (currentView === "inicio") {
      if (role === "recepcion") {
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20, alignItems: "start" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", border: `1px solid ${T.line}`, borderRadius: 20, padding: "48px 24px", minHeight: 260 }}>
                <div style={{ width: "100%", maxWidth: 280 }}>
                  <button onClick={() => setView("nueva-venta")} style={{
                    background: T.ink, color: T.bone, border: "none", borderRadius: 20, padding: "34px 20px",
                    fontSize: 22, fontWeight: 800, display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 14, cursor: "pointer", width: "100%",
                  }}>
                    <PlusCircle size={40} /> Nueva venta
                  </button>
                </div>
              </div>
              <CitasHoy />
            </div>
          </div>
        );
      }
      if (role === "barbero") {
        return (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: "uppercase", color: T.ink }}>Mi resumen</h2>
            <p style={{ color: T.slate, fontSize: 13.5 }}>
              Vista de solo lectura para barberos: tus ventas, servicios, propinas y comisiones del día,
              filtradas automáticamente por Row Level Security en Supabase (solo ves tus propios datos).
            </p>
            <VentasDelDia />
          </div>
        );
      }
    }
    return (
      <div style={{ color: T.slate, fontSize: 13.5 }}>No tienes acceso a esta sección con tu rol actual.</div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: T.bone, color: T.ink }}>
      <style>{`
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: ${T.brass} !important; }
        button:focus-visible, input:focus-visible { outline: 2px solid ${T.brass}; outline-offset: 1px; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 8px; }
      `}</style>

      <div style={{ width: 220, background: T.ink, color: T.bone, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.brass, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scissors size={18} color={T.ink} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>BARBER OS</div>
            <div style={{ fontSize: 10.5, color: T.brass, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {role === "admin" ? "Administrador" : role === "recepcion" ? "Recepción" : "Barbero"}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
          {nav.map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
              borderRadius: 10, border: "none", marginBottom: 3, cursor: "pointer",
              background: currentView === item.id ? "rgba(198,161,91,0.16)" : "transparent",
              color: currentView === item.id ? T.brass : "rgba(250,246,238,0.75)",
              fontWeight: currentView === item.id ? 700 : 500, fontSize: 13.5, textAlign: "left",
            }}>
              <item.icon size={17} />{item.label}
            </button>
          ))}
        </div>
        <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 11.5, color: "rgba(250,246,238,0.55)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <UserCircle2 size={14} /> {profile.full_name}
          </div>
          <button onClick={signOut} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
            padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
            color: T.bone, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "16px 28px", borderBottom: `1px solid ${T.line}`, background: "#FFFFFF" }}>
          <div style={{ fontSize: 13, color: T.slate }}>
            {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div style={{ padding: 28, maxWidth: 1180, margin: "0 auto" }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
