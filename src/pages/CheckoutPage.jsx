import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Landmark, ShieldCheck, Clock, Trash2, Smartphone, Hash } from "lucide-react";
import { T } from "../lib/theme";
import { useCart } from "../hooks/useCart";
import { useShippingRates } from "../hooks/useShippingRates";
import { useVatRates } from "../hooks/useVatRates";
import { useStoreInfo } from "../hooks/useStoreInfo";
import { validateCoupon, computeDiscount } from "../lib/coupons";
import { supabase } from "../lib/supabase";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { useCustomerAddresses } from "../hooks/useCustomerAddresses";
import { useMyPoints } from "../hooks/useMyPoints";
import AddressModal from "../components/AddressModal";
import Layout from "../components/Layout";

const COUNTRIES = [
  { code: "PT", label: "Portugal (Continente)" },
  { code: "PT-ILHAS", label: "Portugal (Açores / Madeira)" },
  { code: "ES", label: "Espanha" },
  { code: "FR", label: "França" },
  { code: "DE", label: "Alemanha" },
  { code: "EU", label: "Outro país da UE" },
  { code: "ROW", label: "Resto do mundo" },
];

const fieldStyle = { width: "100%", padding: "11px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13.5, boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: 12.5, color: T.muted, marginBottom: 6, fontWeight: 600 };

function ScarcityNote({ item }) {
  const msg = useMemo(() => {
    // aleatório mas estável durante a sessão (não muda a cada render/qty update)
    const seed = Math.abs([...item.key].reduce((a, c) => a + c.charCodeAt(0), 0));
    const useStock = seed % 2 === 0;
    if (useStock && item.stock <= 8) {
      return { text: `Só restam ${item.stock} unidades`, color: T.warn };
    }
    const soldCount = 1 + (seed % 8);
    return { text: `Este produto foi vendido ${soldCount} ${soldCount === 1 ? "vez" : "vezes"} nos últimos minutos`, color: T.accent };
  }, [item.key, item.stock]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: msg.color, marginTop: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: msg.color, flexShrink: 0 }} />
      {msg.text}
    </div>
  );
}

function StepHeader({ number, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <span style={{ width: 28, height: 28, borderRadius: "50%", background: T.accent, color: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{number}</span>
      <h2 style={{ margin: 0, fontFamily: T.fontHeading, fontSize: 20, letterSpacing: 0.5 }}>{title}</h2>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const { rates, loading: ratesLoading } = useShippingRates();
  const { rates: vatRates } = useVatRates();
  const { info } = useStoreInfo();
  const { user } = useCustomerAuth();
  const { balance: pointsBalance } = useMyPoints(user);
  const [pointsToUse, setPointsToUse] = useState(0);

  useEffect(() => {
    if (user?.email) setForm((f) => (f.email ? f : { ...f, email: user.email }));
  }, [user]);
  const { addresses: savedAddresses, saveAddress: saveCustomerAddress } = useCustomerAddresses(user);

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", postal: "", city: "", country: "PT" });
  const [wantsNif, setWantsNif] = useState(false);
  const [nif, setNif] = useState("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [shippingSpeed, setShippingSpeed] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [placeError, setPlaceError] = useState("");

  const freeShippingThreshold = info.freeShippingThreshold || 40;
  const countryRate = rates[form.country];

  // extrai o maior número de dias úteis do texto da tarifa (ex: "2-4 dias úteis" -> 4)
  // e soma isso à data de hoje, para dar uma estimativa de entrega real
  const estimatedDeliveryDate = () => {
    if (!countryRate) return null;
    const etaText = shippingSpeed === "express" ? countryRate.expressEta : countryRate.standardEta;
    const numbers = (etaText || "").match(/\d+/g);
    const days = numbers && numbers.length ? Math.max(...numbers.map(Number)) : 5;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const addressReady = form.name && form.email && form.address && form.postal && form.city;

  const shippingCost = useMemo(() => {
    if (!addressReady || !countryRate) return null;
    const base = shippingSpeed === "express" ? countryRate.express : countryRate.standard;
    if (shippingSpeed === "standard" && countryRate.freeEligible && subtotal >= freeShippingThreshold) return 0;
    return base;
  }, [addressReady, countryRate, shippingSpeed, subtotal, freeShippingThreshold]);

  const discount = computeDiscount(coupon, subtotal);
  const pointsRate = info.pointsPerEuroDiscount || 100;
  const maxRedeemablePoints = Math.min(pointsBalance, Math.floor((subtotal - discount) * pointsRate));
  const pointsDiscount = +((pointsToUse / pointsRate).toFixed(2));
  const total = Math.max(0, subtotal - discount - pointsDiscount + (shippingCost || 0));
  const vatRatePercent = vatRates[form.country] ?? null;
  const vatAmount = vatRatePercent !== null ? +(total - total / (1 + vatRatePercent / 100)).toFixed(2) : null;
  const progressPct = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remaining = Math.max(0, freeShippingThreshold - subtotal);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    const found = await validateCoupon(couponInput);
    if (found) {
      setCoupon(found);
      setCouponMsg(`Cupão aplicado: ${found.label}`);
    } else {
      setCoupon(null);
      setCouponMsg("Cupão inválido ou expirado.");
    }
  };

  const placeOrder = async () => {
    setPlaceError("");
    if (!addressReady) { setPlaceError("Preenche o nome, email e morada de envio."); return; }
    if (items.length === 0) { setPlaceError("O teu carrinho está vazio."); return; }
    if (paymentMethod === "card" && info.enableCardPayment === false) {
      setPlaceError("O pagamento por cartão está temporariamente desativado. Escolhe outro método.");
      return;
    }

    setPlacing(true);
    try {
      const billingAddr = !billingSameAsShipping ? savedAddresses.find((a) => a.id === selectedBillingId) : null;
      const effectiveNif = billingAddr ? billingAddr.nif : (wantsNif ? nif : null);

      const addressId = crypto.randomUUID();
      const { error: addrErr } = await supabase
        .from("shipping_addresses")
        .insert({
          id: addressId,
          full_name: form.name, phone: form.phone, email: form.email, address_line1: form.address,
          postal_code: form.postal, city: form.city, country: COUNTRIES.find((c) => c.code === form.country)?.label,
          nif: effectiveNif,
        });
      if (addrErr) throw addrErr;

      const { data: { user: sessionUser } } = await supabase.auth.getUser();

      const orderId = crypto.randomUUID();
      const orderNumber = `TRD-${Math.floor(10000 + Math.random() * 89999)}`;
      const { error: orderErr } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          order_number: orderNumber,
          customer_id: sessionUser?.id || null,
          customer_name: form.name,
          customer_email: form.email,
          shipping_address_id: addressId,
          shipping_country: form.country,
          shipping_speed: shippingSpeed,
          estimated_delivery: estimatedDeliveryDate(),
          vat_rate_percent: vatRatePercent,
          vat_amount: vatAmount,
          status: "pending",
          payment_method: paymentMethod === "card" ? "card" : "bank_transfer",
          payment_status: "unpaid",
          coupon_code: coupon?.code || null,
          discount_amount: discount,
          points_redeemed: pointsToUse || 0,
          subtotal,
          shipping_cost: shippingCost || 0,
          total,
        });
      if (orderErr) throw orderErr;

      const order = { id: orderId, order_number: orderNumber };

      // Regista o gasto dos pontos logo (independente do estado do pagamento —
      // os pontos GANHOS na compra só entram depois, quando o pagamento for confirmado)
      if (pointsToUse > 0 && sessionUser?.id) {
        await supabase.from("points_ledger").insert({
          customer_id: sessionUser.id,
          order_id: orderId,
          points: -pointsToUse,
          reason: "resgate",
        });
      }

      await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: orderId,
          product_id: i.productId,
          variant_id: i.variantId,
          product_name: i.name,
          size: i.size,
          color: i.color,
          unit_price: i.price,
          quantity: i.qty,
          line_total: +(i.price * i.qty).toFixed(2),
        }))
      );

      if (paymentMethod === "card") {
        // Cria a sessão de pagamento no Stripe e redireciona o cliente para lá
        const { data: sessionData, error: fnError } = await supabase.functions.invoke("create-checkout-session", {
          body: {
            orderId: order.id,
            successUrl: `${window.location.origin}/checkout/sucesso?order=${order.order_number}`,
            cancelUrl: `${window.location.origin}/carrinho`,
          },
        });
        if (fnError || !sessionData?.url) throw new Error(fnError?.message || "Não foi possível iniciar o pagamento.");
        window.location.href = sessionData.url;
        return; // a página vai navegar para fora, não há mais nada a fazer aqui
      }

      // Avisa o cliente e a admin por email (transferência bancária — o cartão já
      // é avisado via webhook do Stripe, depois de confirmado o pagamento)
      supabase.functions.invoke("send-order-emails", { body: { orderId } }).catch((err) => {
        console.error("Falha ao enviar emails da encomenda:", err.message);
      });

      setPlacedOrder(order);
    } catch (err) {
      const fullError = [err.message, err.details, err.hint, err.code].filter(Boolean).join(" | ");
      setPlaceError(fullError || "Erro ao finalizar a encomenda.");
      console.error("Erro completo ao finalizar encomenda:", err);
    } finally {
      setPlacing(false);
    }
  };

  if (placedOrder) {
    return (
      <Layout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <h1 style={{ fontFamily: T.fontHeading, fontSize: 28, margin: "0 0 12px" }}>Encomenda recebida!</h1>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
              Número da encomenda: <strong style={{ color: T.accent }}>{placedOrder.order_number}</strong><br />
              Enviamos-te o IBAN e a referência de pagamento por email/telefone em breve.
            </p>
            <Link to="/" style={{ color: T.accent, textDecoration: "none", fontSize: 13.5 }}>← Voltar à loja</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>
        <h1 style={{ fontFamily: T.fontHeading, fontSize: 32, letterSpacing: 0.5, margin: "0 0 28px" }}>Checkout</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "start" }}>
          <div>
            {/* STEP 1 — CARRINHO */}
            <div style={{ marginBottom: 36 }}>
              <StepHeader number={1} title="O teu carrinho" />
              {items.length === 0 ? (
                <div style={{ color: T.muted, fontSize: 13.5, padding: 20, background: T.bgRaised, borderRadius: 10, textAlign: "center" }}>
                  O teu carrinho está vazio. <Link to="/" style={{ color: T.accent }}>Continuar a comprar</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {items.map((i) => (
                    <div key={i.key} style={{ display: "flex", gap: 14, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ width: 68, height: 68, borderRadius: 8, overflow: "hidden", background: T.bgRaised2, flexShrink: 0 }}>
                        {i.image && <img src={i.image} alt={i.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{i.name}</div>
                        <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 8 }}>{i.color} · Tamanho {i.size}</div>
                        <ScarcityNote item={i} />
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 6 }}>
                            <button onClick={() => updateQty(i.key, i.qty - 1)} style={{ background: "none", border: "none", color: T.text, width: 26, height: 26, cursor: "pointer" }}>−</button>
                            <span style={{ width: 24, textAlign: "center", fontSize: 12.5 }}>{i.qty}</span>
                            <button onClick={() => updateQty(i.key, i.qty + 1)} style={{ background: "none", border: "none", color: T.text, width: 26, height: 26, cursor: "pointer" }}>+</button>
                          </div>
                          <button onClick={() => removeItem(i.key)} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <Trash2 size={13} /> Remover
                          </button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>€{(i.price * i.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 2 — MORADA */}
            <div style={{ marginBottom: 36 }}>
              <StepHeader number={2} title="Morada de envio" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nome completo</label>
                  <input style={fieldStyle} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="O teu nome" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Email</label>
                  <input style={fieldStyle} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="o.teu@email.com" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Telemóvel</label>
                  <input style={fieldStyle} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+351 912 345 678" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Morada</label>
                  <input style={fieldStyle} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, andar" />
                </div>
                <div>
                  <label style={labelStyle}>Código postal</label>
                  <input style={fieldStyle} value={form.postal} onChange={(e) => update("postal", e.target.value)} placeholder="0000-000" />
                </div>
                <div>
                  <label style={labelStyle}>Cidade</label>
                  <input style={fieldStyle} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="ex: Lisboa" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>País</label>
                  <select style={fieldStyle} value={form.country} onChange={(e) => update("country", e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.muted, marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={wantsNif} onChange={(e) => setWantsNif(e.target.checked)} style={{ accentColor: T.accent }} />
                Quero colocar NIF na fatura
              </label>
              {wantsNif && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>NIF (número de contribuinte)</label>
                  <input style={fieldStyle} maxLength={9} value={nif} onChange={(e) => setNif(e.target.value)} placeholder="000000000" />
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>A morada de faturação é igual à de entrega?</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map((opt) => (
                    <button
                      key={opt.l}
                      onClick={() => setBillingSameAsShipping(opt.v)}
                      style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                        border: `1px solid ${billingSameAsShipping === opt.v ? T.accent : T.border}`,
                        background: billingSameAsShipping === opt.v ? "rgba(201,255,63,0.08)" : "none",
                        color: billingSameAsShipping === opt.v ? T.accent : T.text,
                      }}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {!billingSameAsShipping && (
                <div style={{ marginBottom: 18, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10 }}>Morada de faturação</div>

                  {!user ? (
                    <div style={{ fontSize: 12.5, color: T.muted }}>
                      Precisas de ter <Link to="/conta" style={{ color: T.accent }}>sessão iniciada</Link> para guardar uma morada de faturação diferente na tua conta.
                    </div>
                  ) : (
                    <>
                      {savedAddresses.length > 0 && (
                        <select
                          style={{ ...fieldStyle, marginBottom: 10 }}
                          value={selectedBillingId || ""}
                          onChange={(e) => setSelectedBillingId(e.target.value)}
                        >
                          <option value="">Escolhe uma morada guardada...</option>
                          {savedAddresses.map((a) => (
                            <option key={a.id} value={a.id}>{a.label || a.fullName} — {a.city}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => setBillingModalOpen(true)}
                        style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.accent, padding: "8px 14px", cursor: "pointer", fontSize: 12.5 }}
                      >
                        + Nova morada de faturação
                      </button>
                    </>
                  )}
                </div>
              )}

              {billingModalOpen && (
                <AddressModal
                  address={null}
                  onClose={() => setBillingModalOpen(false)}
                  onSave={async (addr) => {
                    const saved = { ...addr, isDefaultBilling: true };
                    await saveCustomerAddress(saved);
                    setBillingModalOpen(false);
                  }}
                />
              )}

              {!addressReady ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.muted, fontSize: 12.5, marginBottom: 10 }}>
                  <Clock size={14} /> Preenche a morada para simulares o valor dos portes.
                </div>
              ) : ratesLoading ? (
                <div style={{ color: T.muted, fontSize: 12.5 }}>A calcular portes...</div>
              ) : countryRate ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["standard", "express"].map((speed) => {
                    const price = speed === "express" ? countryRate.express : countryRate.standard;
                    const free = speed === "standard" && countryRate.freeEligible && subtotal >= freeShippingThreshold;
                    const active = shippingSpeed === speed;
                    return (
                      <label key={speed} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 8, border: `1px solid ${active ? T.accent : T.border}`, background: active ? "rgba(201,255,63,0.06)" : "none", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input type="radio" checked={active} onChange={() => setShippingSpeed(speed)} style={{ accentColor: T.accent }} />
                          <div>
                            <div style={{ fontSize: 13.5 }}>{speed === "express" ? "Envio Express" : "Envio Standard"}</div>
                            <div style={{ fontSize: 12, color: T.muted }}>{speed === "express" ? countryRate.expressEta : countryRate.standardEta}</div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: free ? T.accent : T.text }}>{free ? "Grátis" : `€${price.toFixed(2)}`}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* STEP 3 — PAGAMENTO */}
            <div>
              <StepHeader number={3} title="Método de pagamento" />
              {info.enableCardPayment !== false && (
                <label style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 10, border: `1px solid ${paymentMethod === "card" ? T.accent : T.border}`, background: paymentMethod === "card" ? "rgba(201,255,63,0.05)" : "none", cursor: "pointer", marginBottom: 10 }}>
                  <input type="radio" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} style={{ accentColor: T.accent }} />
                  <CreditCard size={20} color={T.muted} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Cartão de crédito/débito</div>
                    <div style={{ fontSize: 12, color: T.muted }}>Pago com segurança via Stripe — és redirecionado para confirmar o pagamento</div>
                  </div>
                </label>
              )}
              {info.enableBankTransfer !== false && (
                <label style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 10, border: `1px solid ${paymentMethod === "bank" ? T.accent : T.border}`, background: paymentMethod === "bank" ? "rgba(201,255,63,0.05)" : "none", cursor: "pointer", marginBottom: 10 }}>
                  <input type="radio" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} style={{ accentColor: T.accent }} />
                  <Landmark size={20} color={T.muted} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Transferência bancária</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{info.companyIban ? "Paga por transferência com o IBAN abaixo" : "Recebes o IBAN por telefone/email — a encomenda avança após confirmação"}</div>
                  </div>
                </label>
              )}
              {info.enableMultibanco && (
                <label style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 10, border: `1px solid ${T.border}`, cursor: "not-allowed", marginBottom: 10, opacity: 0.6 }}>
                  <input type="radio" disabled style={{ accentColor: T.accent }} />
                  <Hash size={20} color={T.muted} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Multibanco</div>
                    <div style={{ fontSize: 12, color: T.muted }}>
                      {info.multibancoEntity ? `Entidade ${info.multibancoEntity} — ` : ""}Disponível brevemente
                    </div>
                  </div>
                </label>
              )}
              {info.enableMbway && (
                <label style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 10, border: `1px solid ${T.border}`, cursor: "not-allowed", marginBottom: 10, opacity: 0.6 }}>
                  <input type="radio" disabled style={{ accentColor: T.accent }} />
                  <Smartphone size={20} color={T.muted} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>MB WAY</div>
                    <div style={{ fontSize: 12, color: T.muted }}>Disponível brevemente</div>
                  </div>
                </label>
              )}
              {paymentMethod === "bank" && (
                <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>
                  {info.companyIban ? (
                    <>
                      Transfere o valor total para o IBAN <strong style={{ color: T.accent }}>{info.companyIban}</strong>, usando o número da encomenda como referência.
                      A encomenda só segue para produção depois de recebermos a transferência.
                    </>
                  ) : (
                    <>
                      Após confirmares a encomenda, enviamos-te o <strong style={{ color: T.text }}>IBAN</strong> e a referência de pagamento.
                      A encomenda só segue para produção depois de recebermos a transferência.
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RESUMO */}
          <aside style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, position: "sticky", top: 24 }}>
            <h2 style={{ fontFamily: T.fontHeading, fontSize: 20, margin: "0 0 16px" }}>Resumo</h2>

            <div style={{ marginBottom: 18 }}>
              <div style={{ height: 6, borderRadius: 4, background: T.bg, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: T.accent, transition: "width .2s" }} />
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>
                {remaining > 0 ? `Faltam €${remaining.toFixed(2)} para portes grátis` : "Tens portes grátis! 🎉"}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Cupão de desconto</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={{ ...fieldStyle, flex: 1 }} value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="ex: TREINO10" />
              <button onClick={applyCoupon} style={{ background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Aplicar</button>
            </div>
            {couponMsg && <div style={{ fontSize: 12, color: coupon ? T.accent : T.danger, marginBottom: 14 }}>{couponMsg}</div>}

            {info.loyaltyPointsEnabled && user && pointsBalance > 0 && (
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
                  <span>Usar pontos ({pointsBalance} disponíveis)</span>
                  <span style={{ color: T.accent }}>−€{pointsDiscount.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxRedeemablePoints}
                  step={Math.max(1, Math.floor(pointsRate / 10))}
                  value={Math.min(pointsToUse, maxRedeemablePoints)}
                  onChange={(e) => setPointsToUse(Number(e.target.value))}
                  style={{ width: "100%", accentColor: T.accent }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginTop: 4 }}>
                  <span>0 pontos</span>
                  <span>{maxRedeemablePoints} pontos (máx.)</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: T.muted }}><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: T.accent }}><span>Desconto</span><span>−€{discount.toFixed(2)}</span></div>}
              {pointsDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: T.accent }}><span>Pontos ({pointsToUse})</span><span>−€{pointsDiscount.toFixed(2)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", color: T.muted }}>
                <span>Envio</span><span>{shippingCost === null ? "A calcular" : shippingCost === 0 ? "Grátis" : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: 4 }}>
                <span>Total</span><span style={{ color: T.accent }}>€{total.toFixed(2)}</span>
              </div>
              {vatAmount !== null && (
                <div style={{ fontSize: 11, color: T.muted, textAlign: "right" }}>
                  {vatRatePercent === 0 ? "Isento de IVA" : `dos quais IVA (${vatRatePercent}%): €${vatAmount.toFixed(2)}`}
                </div>
              )}
            </div>

            {placeError && <div style={{ color: T.danger, fontSize: 12.5, marginTop: 14 }}>{placeError}</div>}

            <button
              onClick={placeOrder}
              disabled={placing}
              style={{ width: "100%", marginTop: 18, background: T.accent, color: T.bg, border: "none", borderRadius: 8, padding: "14px 18px", fontWeight: 700, fontSize: 14.5, cursor: placing ? "default" : "pointer", opacity: placing ? 0.7 : 1 }}
            >
              {placing ? (paymentMethod === "card" ? "A abrir pagamento..." : "A finalizar...") : paymentMethod === "card" ? "Ir para pagamento seguro" : "Finalizar compra"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: T.muted, fontSize: 11.5 }}>
              <ShieldCheck size={14} /> Os teus dados estão protegidos e encriptados
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          div[style*="grid-template-columns: 1.5fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
