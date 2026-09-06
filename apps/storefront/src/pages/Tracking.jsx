import React, {useEffect, useRef, useState} from "react";
import {api} from "../api";
import {rupiah} from "../data";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";

function Tracking({order, navigate, user, onRemember, onOpenPayment}) {
  const [number, setNumber] = useState(order?.number || "");
  const [email, setEmail] = useState(order?.email || user?.email || "");
  const [result, setResult] = useState(order?.server || null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const accessToken = order?.accessToken || "";
  const statusLabel = {
    PENDING_PAYMENT: "Menunggu pembayaran",
    PAID: "Pembayaran diterima",
    PROCESSING: "Sedang diproses",
    SHIPPED: "Sedang dikirim",
    DELIVERED: "Sudah diterima",
    CANCELLED: "Dibatalkan",
    EXPIRED: "Kedaluwarsa",
  };
  const timelineLabel = {
    PENDING_PAYMENT: "Pesanan dibuat",
    PAID: "Pembayaran terkonfirmasi",
    PROCESSING: "Pesanan diproses",
    SHIPPED: "Pesanan dikirim",
    DELIVERED: "Pesanan diterima",
    CANCELLED: "Pesanan dibatalkan",
    EXPIRED: "Pesanan kedaluwarsa",
  };
  const formatTime = (value) =>
    value
      ? new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }).format(new Date(value))
      : "Waktu tidak tersedia";

  const loadWithToken = async () => {
    if (!accessToken || !number || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.guestOrder(number, accessToken);
      const data = response.data;
      setResult(data);
      onRemember({
        number: data.order_number,
        accessToken,
        total: Number(data.grand_total),
        status: data.status,
        paymentStatus: data.payment_status,
        canPay: data.can_pay,
        expiresAt: data.expires_at,
        createdAt: order?.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err.status === 404
          ? "Tautan akses pesanan tidak valid atau sudah diganti. Gunakan tautan pemulihan terbaru dari email."
          : err.message || "Status pesanan belum dapat dimuat. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (accessToken && number && !result) loadWithToken();
  }, [accessToken, number]);
  useEffect(() => {
    if (error) formRef.current?.querySelector("input:not([readonly])")?.focus();
  }, [error]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (accessToken) {
      await loadWithToken();
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await api.track({
        order_number: number.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      });
      setResult(response.data);
      setNumber(response.data.order_number);
    } catch (err) {
      setError(
        err.status === 404
          ? "Pesanan tidak ditemukan. Pastikan nomor pesanan dan email sama persis dengan data checkout."
          : err.message || "Status pesanan belum dapat dimuat. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };
  const continuePayment = () => {
    if (!result?.can_pay || !accessToken) return;
    onOpenPayment({
      ...order,
      number: result.order_number,
      total: Number(result.grand_total),
      status: result.status,
      paymentStatus: "pending",
      customerType: "guest",
      source: "api",
    });
    navigate("payment");
  };
  const shipment = result?.shipment;
  const histories = result?.timeline || [];
  const estimate = shipment?.quote_snapshot?.estimated_days;
  const courier = [shipment?.courier?.toUpperCase(), shipment?.service]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="tracking-page">
      <div className="tracking-intro">
        <h1>Lacak perjalanan pesananmu</h1>
        <p>
          {accessToken
            ? "Akses aman pesanan ditemukan di browser ini. Status dimuat langsung dari Laravel tanpa memakai email sebagai kredensial."
            : "Masukkan nomor pesanan dan email yang digunakan saat checkout untuk pencarian manual."}
        </p>
        <form ref={formRef} onSubmit={submit} aria-busy={loading}>
          <label>
            Nomor pesanan
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="GS-YYYYMMDD-XXXXXXXX"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "tracking-error" : undefined}
              autoCapitalize="characters"
              readOnly={Boolean(accessToken)}
            />
          </label>
          {!accessToken && (
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "tracking-error" : undefined}
                autoComplete="email"
              />
            </label>
          )}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Memeriksa status…"
              : accessToken
                ? "Muat ulang status"
                : "Lacak pesanan"}
          </Button>
        </form>
        {error && (
          <p id="tracking-error" className="notice error" role="alert">
            {error}
          </p>
        )}
        {result && !user && !accessToken && (
          <div className="guest-conversion">
            <strong>Simpan pesanan ini ke akun</strong>
            <p>
              Masuk dengan Google memakai email yang sama agar pesanan yang
              memenuhi syarat dapat ditautkan.
            </p>
            <Button variant="secondary" onClick={() => navigate("login")}>
              Masuk dan tautkan pesanan
            </Button>
          </div>
        )}
      </div>
      {result && (
        <section className="tracking-card" aria-live="polite">
          <div className="tracking-card__head">
            <div>
              <span>Nomor pesanan</span>
              <h2>{result.order_number}</h2>
            </div>
            <strong>{statusLabel[result.status] || result.status}</strong>
          </div>
          {result.grand_total && (
            <div className="tracking-payment-meta">
              <span>
                Total<strong>{rupiah(Number(result.grand_total))}</strong>
              </span>
              <span>
                Status pembayaran
                <strong>{result.payment_status || "Belum tersedia"}</strong>
              </span>
              {result.can_pay && (
                <Button onClick={continuePayment}>Lanjutkan pembayaran</Button>
              )}
            </div>
          )}
          <div className="tracking-meta">
            <span>
              Estimasi layanan
              <strong>
                {estimate ? estimate + " hari" : "Belum tersedia"}
              </strong>
            </span>
            <span>
              Pengiriman
              <strong>
                {courier || "Belum ditentukan"}
                <small>
                  Resi: {shipment?.tracking_number || "Belum tersedia"}
                </small>
              </strong>
            </span>
          </div>
          <div className="timeline">
            {histories.length ? (
              histories.map((item, index) => (
                <div
                  className="done"
                  key={item.id || item.to_status + "-" + index}
                >
                  <span>
                    <Icon name="check" />
                  </span>
                  <p>
                    <strong>
                      {timelineLabel[item.to_status] || item.to_status}
                    </strong>
                    <small>
                      {formatTime(item.created_at)}
                      {item.note ? " · " + item.note : ""}
                    </small>
                  </p>
                </div>
              ))
            ) : (
              <div>
                <span>1</span>
                <p>
                  <strong>Riwayat belum tersedia</strong>
                  <small>
                    Status saat ini:{" "}
                    {statusLabel[result.status] || result.status}
                  </small>
                </p>
              </div>
            )}
          </div>
          <p className="demo-note">
            Status pembayaran, pengiriman, dan kelayakan membayar berasal
            langsung dari backend GutShoes.
          </p>
        </section>
      )}
    </main>
  );
}

export default Tracking;
