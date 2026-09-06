import React, {useEffect, useState} from "react";
import {api} from "../api";
import {rupiah} from "../data";
import Button from "../components/ui/Button";
import Feedback from "../components/ui/Feedback";
import Icon from "../components/ui/Icon";

function GuestOrders({references, navigate, onOpenPayment, onRemember}) {
  const [records, setRecords] = useState(() =>
    references.map((reference) => ({
      ...reference,
      status: reference.status || "LOADING",
    })),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [pageError, setPageError] = useState("");
  const statusLabel = {
    LOADING: "Memuat status",
    PENDING_PAYMENT: "Menunggu pembayaran",
    PAID: "Pembayaran diterima",
    PROCESSING: "Sedang diproses",
    SHIPPED: "Sedang dikirim",
    DELIVERED: "Sudah diterima",
    CANCELLED: "Dibatalkan",
    EXPIRED: "Kedaluwarsa",
    UNAVAILABLE: "Belum dapat diperiksa",
  };
  const formatDate = (value) =>
    value
      ? new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }).format(new Date(value))
      : "Waktu tersimpan tidak tersedia";

  const loadReference = async (reference) => {
    try {
      const response = await api.guestOrder(
        reference.number,
        reference.accessToken,
      );
      const data = response.data;
      const next = {
        ...reference,
        total: Number(data.grand_total),
        status: data.status,
        paymentStatus: data.payment_status,
        canPay: Boolean(data.can_pay),
        expiresAt: data.expires_at,
        server: data,
        error: "",
      };
      onRemember(next);
      return next;
    } catch (error) {
      return {
        ...reference,
        status: "UNAVAILABLE",
        canPay: false,
        error:
          error.status === 404
            ? "Token pesanan ini tidak lagi valid. Buka tautan pemulihan terbaru dari email."
            : error.message || "Status belum dapat dimuat.",
      };
    }
  };
  const loadAll = async () => {
    if (!references.length || refreshing) return;
    setRefreshing(true);
    setPageError("");
    const results = await Promise.all(references.map(loadReference));
    setRecords(results);
    if (results.every((record) => record.status === "UNAVAILABLE"))
      setPageError(
        "Status pesanan belum dapat disinkronkan. Referensi tetap tersimpan agar dapat dicoba lagi.",
      );
    setRefreshing(false);
  };

  useEffect(() => {
    let active = true;
    if (!references.length) {
      setRecords([]);
      return () => {
        active = false;
      };
    }
    setRefreshing(true);
    Promise.all(references.map(loadReference))
      .then((results) => {
        if (active) setRecords(results);
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, [references]);

  const continuePayment = async (record) => {
    if (paymentNumber || !record.canPay) return;
    setPaymentNumber(record.number);
    setPageError("");
    try {
      const response = await api.createGuestPayment(
        record.number,
        record.accessToken,
      );
      const current = response.data.order;
      const next = {
        ...record,
        total: Number(current.grand_total),
        status: current.status,
        paymentStatus: "ready",
        canPay: current.can_pay,
        expiresAt: current.expires_at,
        source: "api",
        customerType: "guest",
        redirectUrl: response.data.redirect_url,
      };
      onRemember(next);
      onOpenPayment(next);
      navigate("payment");
    } catch (error) {
      setPageError(
        Object.values(error?.errors || {}).flat()[0] ||
          error.message ||
          "Sesi pembayaran belum dapat dibuat. Muat ulang status lalu coba lagi.",
      );
    } finally {
      setPaymentNumber("");
    }
  };

  return (
    <main className="guest-orders-page">
      <div className="guest-orders-head">
        <div>
          <h1>Pesanan terakhir saya</h1>
          <p>
            Referensi aman tersimpan di browser ini. Status dan kelayakan
            pembayaran selalu diperiksa ulang ke Laravel menggunakan token
            khusus setiap pesanan.
          </p>
        </div>
        {references.length > 0 && (
          <Button variant="secondary" onClick={loadAll} disabled={refreshing}>
            {refreshing ? "Memuat status…" : "Muat ulang status"}
          </Button>
        )}
      </div>
      {pageError && <Feedback>{pageError}</Feedback>}
      {!references.length ? (
        <section className="guest-orders-empty">
          <Icon name="package" size={36} />
          <h2>Belum ada pesanan tersimpan</h2>
          <p>
            Order guest yang berhasil dibuat akan muncul otomatis di perangkat
            ini. Tautan pemulihan pada email juga dapat menghubungkan kembali
            pesanan ke browser.
          </p>
          <div>
            <Button onClick={() => navigate("tracking")}>
              Lacak dengan nomor order
            </Button>
            <Button variant="secondary" onClick={() => navigate("catalog")}>
              Mulai belanja
            </Button>
          </div>
        </section>
      ) : (
        <section
          className="guest-order-list"
          aria-busy={refreshing}
          aria-live="polite"
        >
          {records.map((record) => (
            <article className="guest-order-row" key={record.number}>
              <div className="guest-order-main">
                <span>
                  Disimpan di perangkat · {formatDate(record.createdAt)}
                </span>
                <h2>{record.number}</h2>
                <p>
                  {record.expiresAt && record.status === "PENDING_PAYMENT"
                    ? "Batas pembayaran " + formatDate(record.expiresAt)
                    : "Status pembayaran " +
                      (record.paymentStatus || "belum tersedia")}
                </p>
                {record.error && (
                  <small className="guest-order-error">{record.error}</small>
                )}
              </div>
              <div className="guest-order-summary">
                {Number.isFinite(Number(record.total)) && (
                  <strong>{rupiah(Number(record.total))}</strong>
                )}
                <span
                  className={
                    "guest-order-status status-" + record.status.toLowerCase()
                  }
                >
                  {statusLabel[record.status] || record.status}
                </span>
              </div>
              <div className="guest-order-actions">
                {record.canPay && (
                  <Button
                    onClick={() => continuePayment(record)}
                    disabled={Boolean(paymentNumber)}
                    aria-busy={paymentNumber === record.number}
                  >
                    {paymentNumber === record.number
                      ? "Menyiapkan pembayaran…"
                      : "Lanjutkan pembayaran"}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    onOpenPayment({
                      ...record,
                      source: "api",
                      customerType: "guest",
                    });
                    navigate("tracking");
                  }}
                >
                  Lihat status lengkap
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
      <p className="guest-order-privacy">
        <Icon name="shield" size={17} /> Token pesanan memberi akses ke detail
        order pada perangkat ini. Hapus data situs jika perangkat akan digunakan
        orang lain.
      </p>
    </main>
  );
}

export default GuestOrders;
