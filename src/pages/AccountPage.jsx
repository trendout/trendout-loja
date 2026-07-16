import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Package, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { T } from "../lib/theme";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { useMyOrders } from "../hooks/useMyOrders";
import { useCustomerAddresses } from "../hooks/useCustomerAddresses";
import { useMyPoints } from "../hooks/useMyPoints";
import { useStoreInfo } from "../hooks/useStoreInfo";
import Layout from "../components/Layout";
import AddressModal from "../components/AddressModal";

const STATUS_LABELS = {
  pending: { label: "Pendente", color: T.muted },
  confirmed: { label: "Confirmada", color: T.warn },
  production: { label: "Em produção", color: "#6fb1ff" },
  shipped: { label: "Enviada", color: "#6fb1ff" },
  delivered: { label: "Entregue", color: T.accent },
  cancelled: { label: "Cancelada", color: T.danger },
};

const fieldStyle = { width: "100%", padding: "11px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13.5, boxSizing: "border-box", marginBottom: 12 };

function AddressesSection({ user }) {
  const { addresses, loading, saveAddress, deleteAddress } = useCustomerAddresses(user);
  const [modalAddr, setModalAddr] = useState(undefined);

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: T.fontHeading, fontSize: 20, margin: 0 }}>As minhas moradas</h2>
        <button onClick={() => setModalAddr(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.accent, padding: "8px 14px", cursor: "pointer", fontSize: 12.5 }}>
          <Plus size={14} /> Nova morada
        </button>
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontSize: 13 }}>A carregar...</div>
      ) : addresses.length === 0 ? (
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, color: T.muted, fontSize: 13, textAlign: "center" }}>
          Sem moradas guardadas ainda.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {addresses.map((a) => (
            <div key={a.id} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <MapPin size={13} color={T.muted} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{a.label || "Morada"}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#cfd3cd", lineHeight: 1.6, marginBottom: 8 }}>
                {a.fullName}<br />
                {a.address}<br />
                {a.postalCode} {a.city}, {a.country}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {a.isDefaultShipping && <span style={{ fontSize: 10.5, color: T.accent, border: `1px solid ${T.accent}55`, borderRadius: 999, padding: "2px 8px" }}>Entrega predefinida</span>}
                {a.isDefaultBilling && <span style={{ fontSize: 10.5, color: T.warn, border: `1px solid ${T.warn}55`, borderRadius: 999, padding: "2px 8px" }}>Faturação</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setModalAddr(a)} style={{ background: "none", border: "none", color: T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><Pencil size={12} /> Editar</button>
                <button onClick={() => deleteAddress(a.id)} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><Trash2 size={12} /> Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAddr !== undefined && (
        <AddressModal address={modalAddr} onClose={() => setModalAddr(undefined)} onSave={async (addr) => { await saveAddress(addr); setModalAddr(undefined); }} />
      )}
    </div>
  );
}

function AuthForm({ signIn, signUp }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        await signUp(email, password, name);
        setInfo("Conta criada! Verifica o teu email para confirmar (se pedido) e depois entra.");
        setMode("signin");
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 24px" }}>
      <h1 style={{ fontFamily: T.fontHeading, fontSize: 28, marginBottom: 6 }}>
        {mode === "signup" ? "Criar conta" : "Entrar na tua conta"}
      </h1>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 24 }}>
        {mode === "signup" ? "Regista-te para veres o histórico das tuas encomendas." : "Vê o estado e o histórico das tuas encomendas."}
      </p>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <input style={fieldStyle} placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input style={fieldStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={fieldStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div style={{ color: T.danger, fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
        {info && <div style={{ color: T.accent, fontSize: 12.5, marginBottom: 12 }}>{info}</div>}
        <button type="submit" style={{ width: "100%", background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "13px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {mode === "signup" ? "Criar conta" : "Entrar"}
        </button>
      </form>
      <div style={{ marginTop: 16, fontSize: 13, color: T.muted, textAlign: "center" }}>
        {mode === "signup" ? (
          <>Já tens conta? <button onClick={() => setMode("signin")} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", padding: 0, fontSize: 13 }}>Entrar</button></>
        ) : (
          <>Ainda não tens conta? <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", padding: 0, fontSize: 13 }}>Criar conta</button></>
        )}
      </div>
    </div>
  );
}

function OrderHistory({ user, signOut }) {
  const { orders, loading } = useMyOrders(user);
  const { balance: pointsBalance, loading: pointsLoading } = useMyPoints(user);
  const { info } = useStoreInfo();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontFamily: T.fontHeading, fontSize: 30, margin: 0 }}>A minha conta</h1>
          <p style={{ color: T.muted, fontSize: 13.5, margin: "4px 0 0" }}>{user.email}</p>
        </div>
        <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, padding: "8px 14px", cursor: "pointer", fontSize: 12.5 }}>
          <LogOut size={14} /> Sair
        </button>
      </div>

      {info.loyaltyPointsEnabled && !pointsLoading && (
        <div style={{ background: T.bgRaised, border: `1px solid ${T.accent}55`, borderRadius: 12, padding: 18, margin: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11.5, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Os teus pontos</div>
            <div style={{ fontFamily: T.fontHeading, fontSize: 28, color: T.accent, marginTop: 2 }}>{pointsBalance}</div>
          </div>
          <div style={{ fontSize: 12, color: T.muted, textAlign: "right", maxWidth: 200 }}>
            {info.pointsPerEuroDiscount > 0 &&
              `Usa-os no checkout — cada ${info.pointsPerEuroDiscount} pontos valem €1 de desconto.`}
          </div>
        </div>
      )}

      <AddressesSection user={user} />

      <h2 style={{ fontFamily: T.fontHeading, fontSize: 20, margin: "0 0 16px" }}>As tuas encomendas</h2>

      {loading ? (
        <div style={{ color: T.muted, fontSize: 13.5 }}>A carregar encomendas...</div>
      ) : orders.length === 0 ? (
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, textAlign: "center", color: T.muted, fontSize: 13.5 }}>
          <Package size={22} style={{ marginBottom: 8, opacity: 0.6 }} /><br />
          Ainda não tens encomendas.<br />
          <Link to="/" style={{ color: T.accent, textDecoration: "none" }}>Começar a comprar →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((o) => {
            const meta = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
            return (
              <div key={o.id} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{o.orderNumber}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{new Date(o.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: meta.color, background: `${meta.color}1a`, border: `1px solid ${meta.color}55`, borderRadius: 999, padding: "4px 10px" }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  {o.items.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{it.productName} <span style={{ color: T.muted }}>({it.color} · {it.size} · x{it.quantity})</span></span>
                      <span>€{it.lineTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                  <span>Total</span><span style={{ color: T.accent }}>€{o.total.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { user, loading, signUp, signIn, signOut } = useCustomerAuth();

  return (
    <Layout>
      {loading ? (
        <div style={{ textAlign: "center", color: T.muted, padding: 60 }}>A carregar...</div>
      ) : user ? (
        <OrderHistory user={user} signOut={signOut} />
      ) : (
        <AuthForm signIn={signIn} signUp={signUp} />
      )}
    </Layout>
  );
}
