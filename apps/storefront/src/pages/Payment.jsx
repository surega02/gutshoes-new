import React, {useState} from "react";
import {api} from "../api";
import {rupiah} from "../data";
import Button from "../components/ui/Button";
import Feedback from "../components/ui/Feedback";
import Icon from "../components/ui/Icon";

function Payment({order, navigate}) {
  const [paymentState, setPaymentState] = useState(
    order?.paymentStatus || "pending",
  );
  const [redirectUrl, setRedirectUrl] = useState(order?.redirectUrl || "");
  const [error, setError] = useState(order?.paymentError || "");
  const retryPayment = async () => {
    if (!order || paymentState === "loading") return;
    setPaymentState("loading");
    setError("");
    try {
      if (order.customerType === "guest" && !order.accessToken)
        throw new Error(
          "Token akses pesanan tidak tersedia di browser ini. Buka kembali tautan pemulihan dari email.",
        );
      const response =
        order.customerType === "guest" || order.accessToken
          ? await api.createGuestPayment(order.number, order.accessToken)
          : await api.createCustomerPayment(order.number, order.email);
      setRedirectUrl(response.data.redirect_url);
      setPaymentState("ready");
    } catch (err) {
      setPaymentState("error");
      setError(
        Object.values(err?.errors || {}).flat()[0] ||
          err.message ||
          "Sesi pembayaran Midtrans belum dapat dibuat.",
      );
    }
  };
  if (!order)
    return (
      <main className="status-page">
        <div className="status-symbol">
          <Icon name="package" size={34} />
        </div>
        <h1>Belum ada pesanan untuk dibayar</h1>
        <p>
          Buat pesanan dari keranjang agar nomor dan total pembayaran dapat
          diverifikasi.
        </p>
        <Button onClick={() => navigate("cart")}>Buka keranjang</Button>
      </main>
    );
  if (order.source === "demo")
    return (
      <main className="status-page">
        <div className="status-symbol">
          <Icon name="package" size={34} />
        </div>
        <p className="status-label">MODE DEMO</p>
        <h1>Simulasi checkout selesai</h1>
        <p>
          Nomor <strong>{order.number}</strong> hanya dibuat di browser. Tidak
          ada order Laravel, reservasi stok, tagihan, atau pembayaran Midtrans.
        </p>
        <div className="payment-box">
          <span>
            Total simulasi<strong>{rupiah(order.total)}</strong>
          </span>
          <span>
            Status pembayaran<strong>Tidak diinisiasi</strong>
          </span>
        </div>
        <Button onClick={() => navigate("cart")}>Kembali ke keranjang</Button>
      </main>
    );
  const ready = paymentState === "ready" && redirectUrl;
  return (
    <main className="status-page">
      <div className="status-symbol">
        <Icon name="package" size={34} />
      </div>
      <p className="status-label" role="status" aria-live="polite">
        {ready
          ? "MENUNGGU PEMBAYARAN"
          : paymentState === "loading"
            ? "MENYIAPKAN PEMBAYARAN"
            : "ORDER SUDAH DIBUAT"}
      </p>
      <h1>
        {ready
          ? "Lanjutkan pembayaran di Midtrans"
          : "Sesi pembayaran belum siap"}
      </h1>
      <p>
        Order <strong>{order.number}</strong> sudah dibuat. Statusnya tetap
        menunggu sampai webhook Midtrans diterima dan diverifikasi backend;
        redirect kembali ke frontend bukan konfirmasi pembayaran.
      </p>
      <div className="payment-box">
        <span>
          Total pembayaran<strong>{rupiah(order.total)}</strong>
        </span>
        <span>
          Status pembayaran<strong>Menunggu webhook</strong>
        </span>
      </div>
      {error && <Feedback>{error}</Feedback>}
      {ready ? (
        <Button onClick={() => window.location.assign(redirectUrl)}>
          Buka pembayaran Midtrans
        </Button>
      ) : (
        <Button
          onClick={retryPayment}
          disabled={paymentState === "loading"}
          aria-busy={paymentState === "loading"}
        >
          {paymentState === "loading"
            ? "Menginisiasi Midtrans…"
            : "Coba inisiasi pembayaran lagi"}
        </Button>
      )}
      <button className="text-link" onClick={() => navigate("tracking")}>
        Periksa status order dari backend
      </button>
      <button className="text-link" onClick={() => navigate("home")}>
        Kembali ke beranda
      </button>
    </main>
  );
}

export default Payment;
