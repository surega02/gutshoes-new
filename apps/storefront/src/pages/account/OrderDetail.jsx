import React, {useEffect, useRef, useState} from "react";
import {api} from "../../api";
import {rupiah} from "../../data";
import AccountShell from "../../components/layout/AccountShell";
import Button from "../../components/ui/Button";
import Feedback from "../../components/ui/Feedback";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

export default function OrderDetail({user, orderNumber, navigate, onLogout}) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const requestInFlight = useRef(false);
  const cancellationKey = useRef(crypto.randomUUID());
  useEffect(() => {
    let active = true;
    setOrder(null);
    setError("");
    api.order(orderNumber).then(response => { if (active) setOrder(response.data); })
      .catch(err => { if (active) setError(err.message || "Pesanan belum dapat dimuat."); });
    return () => { active = false; };
  }, [orderNumber, user.id, version]);
  const cancel = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true);
    setError("");
    setConfirm(false);
    try {
      const response = await api.cancel(orderNumber, {reason: "Dibatalkan oleh pelanggan"}, cancellationKey.current);
      setOrder(current => ({...current, status: response.data.cancellation.order.status,
        refunds: response.data.refund ? [response.data.refund] : []}));
      setVersion(value => value + 1);
    } catch (err) {
      setError(err.message || "Pembatalan belum terkonfirmasi. Coba lagi untuk memeriksa permintaan yang sama.");
    } finally { requestInFlight.current = false; setBusy(false); }
  };
  const pay = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await api.createCustomerPayment(orderNumber, user.email);
      window.location.assign(response.data.redirect_url);
    } catch (err) { setError(err.message || "Pembayaran belum dapat dibuka."); }
    finally { requestInFlight.current = false; setBusy(false); }
  };
  const address = order?.addresses?.find(item => item.type === "SHIPPING");
  return <AccountShell active="orders" navigate={navigate} user={user} onLogout={onLogout}>
    <ConfirmDialog open={confirm} title="Batalkan pesanan?"
      description={order?.status === "PAID" ? "Pembatalan akan membuat permintaan refund untuk ditinjau admin." : "Pembatalan akan diperiksa sebelum stok dilepas."}
      confirmLabel="Ya, batalkan" onConfirm={cancel} onCancel={() => setConfirm(false)} />
    <button className="back-link" onClick={() => navigate("orders")}>Kembali ke riwayat</button>
    <Feedback>{error}</Feedback>
    <Button variant="ghost" disabled={busy} onClick={() => setVersion(v => v + 1)}>Muat ulang status</Button>
    {!order && !error && <p role="status">Memuat pesanan…</p>}
    {order && <>
      <div className="order-detail-head"><div><h2>{order.order_number}</h2><p>{new Date(order.created_at).toLocaleString("id-ID")}</p></div>
        <span className="order-state">{order.status}</span></div>
      <section className="order-detail-block"><h3>Produk</h3>{order.items.map(item => <div className="order-product-line order-product-line--snapshot" key={item.id}>
        <span><strong>{item.product_name}</strong><small>{item.brand_name} · Ukuran {item.size_label} · {item.sku} · {item.quantity} barang</small></span>
        <strong>{rupiah(Number(item.line_total))}</strong>
      </div>)}</section>
      <div className="order-detail-columns"><section className="order-detail-block"><h3>Pengiriman</h3>
        <p>{address?.recipient_name}<br />{address?.address_line}<br />{address?.city} {address?.postal_code}</p>
        <p>{order.shipment?.courier} · {order.shipment?.service}<br />Resi: {order.shipment?.tracking_number || "Belum tersedia"}</p>
      </section><section className="order-detail-block"><h3>Pembayaran</h3><p>Status: {order.payment?.status || "Belum dimulai"}</p>
        <p>Subtotal {rupiah(Number(order.subtotal))}<br />Pengiriman {rupiah(Number(order.shipping_fee))}<br />
          Diskon {rupiah(Number(order.product_discount) + Number(order.voucher_discount))}<br />Total <strong>{rupiah(Number(order.grand_total))}</strong></p>
      </section></div>
      {order.refunds?.map(refund => <section className="refund-card" key={refund.id}><h3>Refund {refund.status}</h3><p>{rupiah(Number(refund.amount))}</p></section>)}
      {order.status === "PENDING_PAYMENT" && <Button onClick={pay} disabled={busy}>Lanjutkan pembayaran</Button>}
      {["PENDING_PAYMENT", "PAID"].includes(order.status) && <div className="order-danger-zone"><p>Pembatalan tersedia sebelum pesanan mulai diproses.</p>
        <Button variant="secondary" disabled={busy} onClick={() => setConfirm(true)}>{busy ? "Memproses…" : "Ajukan pembatalan"}</Button></div>}
    </>}
  </AccountShell>;
}
