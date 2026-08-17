import React, { useState } from "react";
import { Scissors } from "lucide-react";
import { T } from "../lib/theme";
import { signIn } from "../services/auth";
import { inputStyle, labelStyle } from "./ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      // onAuthStateChange en useAuth() se encarga de refrescar la sesión/perfil.
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.ink, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: 20,
    }}>
      <form onSubmit={handleSubmit} style={{ background: T.bonePanel, borderRadius: 20, padding: 32, width: 340, maxWidth: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scissors size={24} color={T.brass} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.ink }}>BARBER OS</div>
          <div style={{ fontSize: 12.5, color: T.slate }}>Inicia sesión para continuar</div>
        </div>

        <label style={labelStyle}>Correo</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle()} placeholder="tucorreo@ejemplo.com" />

        <label style={labelStyle}>Contraseña</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle()} placeholder="••••••••" />

        {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 10, fontWeight: 600 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{
          marginTop: 18, width: "100%", background: T.ink, color: T.bone, border: "none", borderRadius: 12,
          padding: "13px 16px", fontWeight: 700, fontSize: 14.5, cursor: loading ? "wait" : "pointer",
        }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <div style={{ fontSize: 11, color: T.slate, marginTop: 16, textAlign: "center" }}>
          Los usuarios se crean desde el panel de Supabase por el administrador. No hay registro público.
        </div>
      </form>
    </div>
  );
}
