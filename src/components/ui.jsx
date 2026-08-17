import React from "react";
import { X } from "lucide-react";
import { T } from "../lib/theme";

export function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div style={{
      background: T.bonePanel, border: `1px solid ${T.line}`, borderRadius: 16,
      padding: "18px 20px", flex: "1 1 160px", minWidth: 150,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: T.slate, fontWeight: 600 }}>{label}</span>
        {Icon && <Icon size={16} color={accent || T.brassDim} />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.slate, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: T.ink, margin: 0 }}>{children}</h2>
      {right}
    </div>
  );
}

export function Panel({ children, style }) {
  return (
    <div style={{ background: T.bonePanel, border: `1px solid ${T.line}`, borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
      border: `1px solid ${active ? T.ink : T.line}`,
      background: active ? T.ink : "transparent",
      color: active ? T.bone : T.slate,
    }}>{children}</button>
  );
}

export function BigButton({ children, onClick, icon: Icon, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#D8D0BC" : T.ink, color: T.bone, border: "none", borderRadius: 14,
      padding: "16px 20px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center",
      justifyContent: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", width: "100%",
    }}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}

export function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: bold ? 16 : 13.5, fontWeight: bold ? 800 : 500, color: T.ink }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

export function Modal({ children, onClose, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(21,19,15,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.bonePanel, borderRadius: 18, padding: 24, width: 340, maxWidth: "90vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputStyle = (withIcon) => ({
  width: "100%", padding: withIcon ? "11px 12px 11px 36px" : "11px 12px", borderRadius: 10,
  border: `1px solid ${T.line}`, fontSize: 14, outline: "none", background: T.bone, color: T.ink, boxSizing: "border-box",
});
export const cardBtnStyle = (active) => ({
  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12,
  border: `1.5px solid ${active ? T.ink : T.line}`, background: active ? "#F2EAD6" : T.bone,
  cursor: "pointer", textAlign: "left",
});
export const qtyBtn = { width: 26, height: 26, borderRadius: 8, border: `1px solid ${T.line}`, background: "#fff", cursor: "pointer", fontWeight: 700 };
export const secondaryBtn = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: `1px solid ${T.line}`, borderRadius: 14, padding: "16px 14px", fontWeight: 700, fontSize: 14, color: T.ink, cursor: "pointer" };
export const labelStyle = { fontSize: 11.5, fontWeight: 700, color: T.slate, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", margin: "10px 0 6px" };
export const iconBtn = { width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.line}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
export const addBtn = { display: "flex", alignItems: "center", gap: 6, background: T.ink, color: T.bone, border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer" };
