import React, { useState } from "react";
import { X } from "lucide-react";
import { T } from "../lib/theme";

export const COUNTRIES = ["Portugal", "Espanha", "França", "Alemanha", "Outro"];

const fieldStyle = { width: "100%", padding: "11px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13.5, boxSizing: "border-box", marginBottom: 12 };

export default function AddressModal({ address, onClose, onSave }) {
  const [form, setForm] = useState(address || {
    id: crypto.randomUUID(), label: "", fullName: "", phone: "", address: "",
    postalCode: "", city: "", country: "Portugal", nif: "",
    isDefaultShipping: false, isDefaultBilling: false,
  });

  const submit = () => {
    if (!form.fullName.trim() || !form.address.trim() || !form.postalCode.trim() || !form.city.trim()) return;
    onSave(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, padding: "40px 16px", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 440, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: T.fontHeading, fontSize: 20 }}>{address ? "Editar morada" : "Nova morada"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <input style={fieldStyle} placeholder="Nome da morada (ex: Casa, Trabalho)" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
        <input style={fieldStyle} placeholder="Nome completo" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        <input style={fieldStyle} placeholder="Telemóvel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <input style={fieldStyle} placeholder="Morada" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input style={fieldStyle} placeholder="Código postal" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
          <input style={fieldStyle} placeholder="Cidade" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        </div>
        <select style={fieldStyle} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={fieldStyle} placeholder="NIF (opcional, para fatura)" value={form.nif} onChange={(e) => setForm((f) => ({ ...f, nif: e.target.value }))} />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.muted, marginBottom: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={form.isDefaultShipping} onChange={(e) => setForm((f) => ({ ...f, isDefaultShipping: e.target.checked }))} style={{ accentColor: T.accent }} />
          Usar como morada de entrega predefinida
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.muted, marginBottom: 18, cursor: "pointer" }}>
          <input type="checkbox" checked={form.isDefaultBilling} onChange={(e) => setForm((f) => ({ ...f, isDefaultBilling: e.target.checked }))} style={{ accentColor: T.accent }} />
          Usar também como morada de faturação
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
          <button onClick={submit} style={{ background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Guardar morada</button>
        </div>
      </div>
    </div>
  );
}
