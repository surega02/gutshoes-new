import React, {useState} from "react";
import {products, rupiah} from "../../data";
import AccountShell from "../../components/layout/AccountShell";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Icon from "../../components/ui/Icon";

function OrderDetail({user, orderNumber, navigate, onLogout}) {
  const [status, setStatus] = useState(
    orderNumber.includes("00037") ? "DELIVERED" : "PAID",
  );
  const [refund, setRefund] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const eligible = ["PENDING_PAYMENT", "PAID"].includes(status);
  const cancel = () => {
    setStatus("CANCELLED");
    setRefund(status === "PAID" ? "PENDING" : null);
    setConfirm(false);
  };
  return (
    <AccountShell
      active="orders"
      navigate={navigate}
      user={user}
      onLogout={onLogout}
    >
      <ConfirmDialog
        open={confirm}
        title="Batalkan pesanan?"
        description={
          status === "PAID"
            ? "Pembayaran sudah diterima. Pembatalan akan membuat permintaan refund untuk ditinjau admin."
            : "Reservasi stok akan dilepas setelah pembatalan dikonfirmasi backend."
        }
        confirmLabel="Ya, batalkan"
        onCancel={() => setConfirm(false)}
        onConfirm={cancel}
      />
      <button className="back-link" onClick={() => navigate("orders")}>
        <Icon name="back" /> Kembali ke riwayat
      </button>
      <div className="order-detail-head">
        <div>
          <span>DETAIL PESANAN</span>
          <h2>{orderNumber}</h2>
          <p>22 Agustus 2026 · Pembayaran terkonfirmasi</p>
        </div>
        <span className={`order-state ${status === "DELIVERED" ? "done" : ""}`}>
          {status.replace("_", " ")}
        </span>
      </div>
      <div className="order-progress">
        {["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].map((x, i) => (
          <div
            className={
              ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].indexOf(status) >=
              i
                ? "done"
                : ""
            }
            key={x}
          >
            <b>{i + 1}</b>
            <span>{x}</span>
          </div>
        ))}
      </div>
      <section className="order-detail-block">
        <h3>Produk</h3>
        <div className="order-product-line">
          <img src={products[0].image} alt="" />
          <span>
            <strong>Stride Flow</strong>
            <small>AeroRun · Ukuran 42 · SKU GS-1042-NAVY · 1 barang</small>
          </span>
          <strong>{rupiah(699000)}</strong>
        </div>
      </section>
      <div className="order-detail-columns">
        <section className="order-detail-block">
          <h3>Pengiriman</h3>
          <p>
            JNE Reguler · Rp18.000
            <br />
            Jl. Contoh No. 17, Jakarta Selatan 12120
            <br />
            <strong>Resi:</strong>{" "}
            {status === "SHIPPED" || status === "DELIVERED"
              ? "JNE0123456789"
              : "Menunggu pengiriman"}
          </p>
        </section>
        <section className="order-detail-block">
          <h3>Ringkasan pembayaran</h3>
          <p>
            Subtotal <strong>{rupiah(699000)}</strong>
            <br />
            Pengiriman <strong>{rupiah(18000)}</strong>
            <br />
            Total <strong>{rupiah(717000)}</strong>
          </p>
        </section>
      </div>
      {refund && (
        <section className="refund-card">
          <div>
            <span>REFUND TERPISAH DARI STATUS PESANAN</span>
            <h3>Refund {refund}</h3>
            <p>
              Permintaan sedang menunggu pemeriksaan admin. Hasilnya akan
              dikirim melalui email.
            </p>
          </div>
          <span className="order-state">{refund}</span>
        </section>
      )}
      {eligible && (
        <div className="order-danger-zone">
          <div>
            <strong>Perlu membatalkan pesanan?</strong>
            <p>Pembatalan hanya tersedia sebelum pesanan mulai diproses.</p>
          </div>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            Ajukan pembatalan
          </Button>
        </div>
      )}
      <p className="demo-note">
        Detail dan transisi ini adalah simulasi frontend. Backend wajib
        memvalidasi kepemilikan, status, dan kelayakan pembatalan.
      </p>
    </AccountShell>
  );
}

export default OrderDetail;
