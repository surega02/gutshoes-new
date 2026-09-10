import React, {useEffect, useMemo, useRef, useState} from "react";
import {api, isBackendUnavailable} from "../api";
import {rupiah} from "../data";
import RegionFields from "../components/forms/RegionFields";
import Button from "../components/ui/Button";
import Feedback from "../components/ui/Feedback";
import Icon from "../components/ui/Icon";
import OrderSummary from "../components/checkout/OrderSummary";

function Checkout({
  cart,
  navigate,
  createOrder,
  user,
  addresses,
  onCheckoutCreated,
  cartSource,
  ensureServerCart,
}) {
  const [step, setStep] = useState(1);
  const [buyer, setBuyer] = useState(null);
  const [shippingService, setShippingService] = useState("REG");
  const [serverShipping, setServerShipping] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [voucher, setVoucher] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [mode, setMode] = useState(cartSource);
  const [operation, setOperation] = useState("");
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState([]);
  const checkoutFormRef = useRef(null);
  const attemptStorageKey = "gutshoes-checkout-" + (user?.id || "guest");
  const orderAttempt = useRef(null);
  if (!orderAttempt.current) {
    try { orderAttempt.current = JSON.parse(sessionStorage.getItem(attemptStorageKey)); } catch { /* Ignore invalid local state. */ }
  }
  const submittingOrder = useRef(false);
  const shippingOptions = [
    {
      service: "REG",
      courier: "jne",
      name: "Reguler",
      eta: "2–4 hari kerja",
      demoFee: 18000,
    },
    {
      service: "YES",
      courier: "jne",
      name: "Express",
      eta: "1–2 hari kerja",
      demoFee: 32000,
    },
  ];
  const selectedShipping =
    shippingOptions.find((option) => option.service === shippingService) ||
    shippingOptions[0];
  const fallbackPricing = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.product.price * item.qty,
      0,
    );
    const voucherDiscount =
      appliedVoucher.toUpperCase() === "GUTDEMO"
        ? Math.min(50000, subtotal * 0.1)
        : 0;
    return {
      subtotal,
      product_discount: 0,
      voucher_discount: voucherDiscount,
      shipping_fee: selectedShipping.demoFee,
      grand_total: subtotal + selectedShipping.demoFee - voucherDiscount,
    };
  }, [cart, selectedShipping.demoFee, appliedVoucher]);
  const shownPricing = pricing || (mode === "demo" ? fallbackPricing : null);

  const messageFor = (err, fallback) => {
    const fieldMessage = Object.values(err?.errors || {}).flat()[0];
    return fieldMessage || err?.message || fallback;
  };
  useEffect(() => {
    if (!error || step !== 1) return;
    checkoutFormRef.current
      ?.querySelector('[aria-invalid="true"], input:invalid, textarea:invalid')
      ?.focus();
  }, [error, invalidFields, step]);
  const quotePayload = (service = shippingService, code = appliedVoucher) => ({
    destination_area_id: buyer?.village_code || "destination",
    province_code: buyer?.province_code,
    regency_code: buyer?.regency_code,
    district_code: buyer?.district_code,
    village_code: buyer?.village_code,
    courier: "jne",
    service,
    voucher_code: code || null,
  });
  const validateQuote = async (
    service = shippingService,
    code = appliedVoucher,
  ) => {
    setOperation(code ? "voucher" : "quote");
    setError("");
    setInvalidFields([]);
    try {
      if (cartSource !== "api") throw new Error("Keranjang belum siap. Muat ulang lalu coba lagi.");
      const serverCart = await ensureServerCart();
      const response = await api.quote(
        quotePayload(service, code),
        serverCart.token,
      );
      setPricing({
        ...response.data.pricing,
        shipping_fee: Number(response.data.pricing.shipping_fee),
        voucher_discount: Number(response.data.pricing.voucher_discount),
        grand_total: Number(response.data.pricing.grand_total),
      });
      setServerShipping(response.data.shipping);
      setShippingService(response.data.shipping.service);
      setMode("api");
      setAppliedVoucher(code);
      return true;
    } catch (err) {
      setPricing(null);
      setInvalidFields(Object.keys(err?.errors || {}));
      setError(
        messageFor(
          err,
          "Keranjang, alamat, ongkir, atau voucher ditolak backend. Periksa data lalu coba lagi.",
        ),
      );
      return false;
    } finally {
      setOperation("");
    }
  };
  const next = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setInvalidFields([]);
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const selectedAddress = addresses.find(
      (address) => String(address.id) === data.savedAddress,
    );
    if (
      !selectedAddress &&
      (!data.province_code ||
        !data.regency_code ||
        !data.district_code ||
        !data.village_code)
    ) {
      setError(
        "Pilih provinsi, kota/kabupaten, kecamatan, dan kelurahan/desa sebelum melanjutkan.",
      );
      setInvalidFields([
        "province_code",
        "regency_code",
        "district_code",
        "village_code",
        "postal",
      ]);
      return;
    }
    const nextBuyer = selectedAddress
      ? {
          ...data,
          name: selectedAddress.recipient,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          province: selectedAddress.province,
          city: selectedAddress.city,
          province_code: selectedAddress.provinceCode,
          regency_code: selectedAddress.regencyCode,
          district_code: selectedAddress.districtCode,
          village_code: selectedAddress.villageCode,
          postal: selectedAddress.postal,
          providerAreaId:
            selectedAddress.providerAreaId || selectedAddress.city,
        }
      : data;
    setBuyer(nextBuyer);
    setError("");
    setOperation("quote");
    try {
      const serverCart = await ensureServerCart();
      const response = await api.quote(
        {
          destination_area_id: nextBuyer.village_code,
          province_code: nextBuyer.province_code,
          regency_code: nextBuyer.regency_code,
          district_code: nextBuyer.district_code,
          village_code: nextBuyer.village_code,
          courier: "jne",
          service:
            shippingService === "REGIONAL_PER_ITEM" ? "REG" : shippingService,
          voucher_code: null,
        },
        serverCart.token,
      );
      setPricing({
        ...response.data.pricing,
        shipping_fee: Number(response.data.pricing.shipping_fee),
        voucher_discount: Number(response.data.pricing.voucher_discount),
        grand_total: Number(response.data.pricing.grand_total),
      });
      setServerShipping(response.data.shipping);
      setShippingService(response.data.shipping.service);
      setMode("api");
      setStep(2);
    } catch (err) {
      setPricing(null);
      setError(messageFor(err, "Ongkir belum dapat diperiksa. Coba lagi; checkout belum dilanjutkan."));
    } finally {
      setOperation("");
    }
  };
  const changeShipping = async (service) => {
    setShippingService(service);
    await validateQuote(service, appliedVoucher);
  };
  const applyVoucher = async () => {
    const code = voucher.trim().toUpperCase();
    if (!code) {
      setAppliedVoucher("");
      await validateQuote(shippingService, "");
      return;
    }
    await validateQuote(shippingService, code);
  };
  const orderPayload = {
    customer: {name: buyer?.name, email: buyer?.email, phone: buyer?.phone},
    address: {
      recipient_name: buyer?.name,
      phone: buyer?.phone,
      address_line: buyer?.address,
      province_code: buyer?.province_code,
      regency_code: buyer?.regency_code,
      district_code: buyer?.district_code,
      village_code: buyer?.village_code,
      postal_code: buyer?.postal,
      provider_area_id: buyer?.village_code,
    },
    shipping: {
      courier: serverShipping?.courier || "jne",
      service: serverShipping?.service || shippingService,
    },
    voucher_code: appliedVoucher || null,
  };
  const submitOrder = async () => {
    if (submittingOrder.current || operation || (!orderAttempt.current && (!buyer || mode !== "api" || !pricing))) return;
    submittingOrder.current = true;
    setOperation("order");
    setError("");

    try {
      // Keep the exact request and key when the response is lost. Do not create a new order.
      if (!orderAttempt.current) {
        const serverCart = await ensureServerCart();
        orderAttempt.current = {payload: orderPayload, token: serverCart.token, key: crypto.randomUUID()};
        sessionStorage.setItem(attemptStorageKey, JSON.stringify(orderAttempt.current));
      }
      const attempt = orderAttempt.current;
      const created = await api.checkout(attempt.payload, attempt.token, attempt.key);
      sessionStorage.removeItem(attemptStorageKey);
      orderAttempt.current = null;
      const accessToken = created.data.guest_access_token || "";
      const customerType = user ? "customer" : "guest";
      const orderData = {
        number: created.data.order_number,
        total: Number(created.data.grand_total),
        email: created.data.customer_email,
        accessToken,
        customerType,
        source: "api",
        paymentStatus: "initializing",
        status: "PENDING_PAYMENT",
        createdAt: new Date().toISOString(),
      };
      createOrder(orderData);
      setOperation("payment");
      try {
        if (customerType === "guest" && !accessToken)
          throw new Error(
            "Token pemulihan guest tidak diterima. Simpan nomor order dan hubungi dukungan.",
          );
        const payment =
          customerType === "guest"
            ? await api.createGuestPayment(orderData.number, accessToken)
            : await api.createCustomerPayment(orderData.number, orderData.email);
        createOrder({
          ...orderData,
          redirectUrl: payment.data.redirect_url,
          paymentStatus: "ready",
        });
      } catch (paymentError) {
        createOrder({
          ...orderData,
          paymentStatus: "error",
          paymentError: messageFor(
            paymentError,
            "Sesi pembayaran Midtrans belum dapat dibuat.",
          ),
        });
      }
      onCheckoutCreated();
      navigate("payment");
    } catch (err) {
      if (err.status === 422) {
        orderAttempt.current = null;
        sessionStorage.removeItem(attemptStorageKey);
      }
      setError(isBackendUnavailable(err)
        ? "Status pembuatan pesanan belum pasti. Tekan coba lagi untuk memeriksa permintaan yang sama; jangan membuat pesanan baru."
        : messageFor(err, "Pesanan belum dapat dibuat. Periksa data lalu coba lagi."));
    } finally {
      submittingOrder.current = false;
      setOperation("");
    }
  };

  if (orderAttempt.current && !buyer) return (
    <main className="checkout-page">
      <h1>Periksa pesanan sebelumnya</h1>
      <p>Hasil permintaan sebelumnya belum diterima. Periksa kembali sebelum membuat pesanan baru.</p>
      <Feedback>{error}</Feedback>
      <Button onClick={submitOrder} disabled={Boolean(operation)}>
        {operation ? "Memeriksa pesanan…" : "Periksa pesanan"}
      </Button>
    </main>
  );

  if (!cart.length)
    return (
      <main className="checkout-page">
        <div className="empty">
          <Icon name="cart" size={36} />
          <h1>Keranjang belum siap di-checkout</h1>
          <p>Tambahkan setidaknya satu sepatu sebelum melanjutkan.</p>
          <Button onClick={() => navigate("catalog")}>
            Lihat semua sepatu
          </Button>
        </div>
      </main>
    );
  const busy = Boolean(operation);
  return (
    <main className="checkout-page">
      <button className="back-link" onClick={() => navigate("cart")}>
        <Icon name="back" /> Kembali ke keranjang
      </button>
      <div className="checkout-head">
        <h1>Checkout</h1>
        <div className="steps" aria-label="Tahapan checkout">
          {["Data pembeli", "Pengiriman", "Pembayaran"].map((label, index) => (
            <span
              className={step >= index + 1 ? "active" : ""}
              aria-current={step === index + 1 ? "step" : undefined}
              key={label}
            >
              <b>
                {step > index + 1 ? <Icon name="check" size={15} /> : index + 1}
              </b>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="checkout-layout">
        <section className="checkout-form" aria-busy={busy}>
          <div className={`checkout-mode ${mode}`} role="status">
            <strong>
              {mode === "api"
                ? "Terhubung ke API Laravel"
                : "Mode demo — tanpa transaksi nyata"}
            </strong>
            <span>
              {mode === "api"
                ? "Nilai akhir divalidasi server."
                : "Ongkir dan voucher hanya simulasi lokal."}
            </span>
          </div>
          {step === 1 && (
            <form ref={checkoutFormRef} onSubmit={next}>
              <h2>{user ? "Pilih alamat pengiriman" : "Data pembeli"}</h2>
              <p>
                {user
                  ? "Gunakan alamat tersimpan atau masukkan tujuan baru."
                  : "Masuk tidak wajib. Informasi ini digunakan untuk pembaruan pesanan."}
              </p>
              {user && addresses.length > 0 && (
                <div
                  className="saved-address-choice"
                  role="radiogroup"
                  aria-label="Alamat tersimpan"
                >
                  {addresses.map((address) => (
                    <label
                      className={address.isDefault ? "selected" : ""}
                      key={address.id}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        value={address.id}
                        defaultChecked={address.isDefault}
                      />
                      <span>
                        <strong>
                          {address.label} · {address.recipient}
                        </strong>
                        <small>
                          {address.address}, {address.city} {address.postal}
                        </small>
                      </span>
                      {address.isDefault && <b>Utama</b>}
                    </label>
                  ))}
                </div>
              )}
              <div className="form-grid">
                <label>
                  Nama lengkap
                  <input
                    name="name"
                    required
                    maxLength="100"
                    autoComplete="name"
                    aria-invalid={invalidFields.includes("name")}
                    aria-describedby={invalidFields.includes("name") ? "checkout-error" : undefined}
                    defaultValue={user?.name || ""}
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    required
                    type="email"
                    autoComplete="email"
                    aria-invalid={invalidFields.includes("email")}
                    aria-describedby={invalidFields.includes("email") ? "checkout-error" : undefined}
                    defaultValue={user?.email || ""}
                    readOnly={Boolean(user)}
                  />
                </label>
                <label>
                  Nomor telepon
                  <input
                    name="phone"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={invalidFields.includes("phone")}
                    aria-describedby={invalidFields.includes("phone") ? "checkout-error" : undefined}
                    pattern="[0-9+ -]{8,20}"
                    defaultValue={user?.phone || ""}
                  />
                </label>
                <label className="span-2">
                  Alamat lengkap
                  <textarea
                    name="address"
                    required
                    maxLength="255"
                    autoComplete="street-address"
                    aria-invalid={invalidFields.includes("address")}
                    aria-describedby={invalidFields.includes("address") ? "checkout-error" : undefined}
                    defaultValue={
                      addresses.find((address) => address.isDefault)?.address ||
                      ""
                    }
                  />
                </label>
                <RegionFields
                  initial={addresses.find((address) => address.isDefault) || {}}
                  searchable
                  invalidFields={invalidFields}
                  errorId="checkout-error"
                />
              </div>
              <Feedback id="checkout-error">{error}</Feedback>
              <Button
                type="submit"
                disabled={busy}
                aria-busy={operation === "quote"}
              >
                {operation === "quote" ? (
                  "Memvalidasi keranjang dan alamat…"
                ) : (
                  <>
                    Validasi & pilih pengiriman <Icon name="arrow" />
                  </>
                )}
              </Button>
            </form>
          )}
          {step === 2 && (
            <div>
              <h2>Pilih layanan pengiriman</h2>
              <p>
                {mode === "api"
                  ? serverShipping?.provider === "GUTSHOES_REGIONAL"
                    ? "Tujuan di luar Jabodetabek memakai tarif regional tetap per item dan seluruh ongkir dibayar pembeli."
                    : "Tarif Jabodetabek divalidasi melalui provider pengiriman berdasarkan keranjang dan tujuan."
                  : "Tarif di bawah adalah angka demo dan tidak mengikat."}
              </p>
              <div className="shipping-options">
                {serverShipping?.provider === "GUTSHOES_REGIONAL" ? (
                  <label className="selected">
                    <input type="radio" name="shipping" checked readOnly />
                    <Icon name="truck" />
                    <span>
                      <strong>Tarif regional per item</strong>
                      <small>
                        {serverShipping.description} ·{" "}
                        {cart.reduce((sum, item) => sum + item.qty, 0)} item
                      </small>
                    </span>
                    <b>{rupiah(Number(serverShipping.fee))}</b>
                  </label>
                ) : (
                  shippingOptions.map((option) => (
                    <label
                      className={
                        shippingService === option.service ? "selected" : ""
                      }
                      key={option.service}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingService === option.service}
                        onChange={() => changeShipping(option.service)}
                        disabled={busy}
                      />
                      <Icon name="truck" />
                      <span>
                        <strong>{option.name}</strong>
                        <small>
                          {option.eta} · {option.courier.toUpperCase()}{" "}
                          {option.service}
                        </small>
                      </span>
                      <b>
                        {rupiah(
                          shippingService === option.service && shownPricing
                            ? Number(shownPricing.shipping_fee)
                            : option.demoFee,
                        )}
                      </b>
                    </label>
                  ))
                )}
              </div>
              <div className="voucher">
                <label>
                  Kode voucher
                  <input
                    value={voucher}
                    onChange={(event) => setVoucher(event.target.value)}
                    maxLength="64"
                    autoComplete="off"
                    placeholder="Masukkan kode"
                    disabled={busy}
                  />
                </label>
                <Button
                  variant="secondary"
                  onClick={applyVoucher}
                  disabled={busy}
                  aria-busy={operation === "voucher"}
                >
                  {operation === "voucher" ? "Memeriksa…" : "Terapkan"}
                </Button>
              </div>
              {appliedVoucher && (
                <p className="voucher-result">
                  Kode <strong>{appliedVoucher}</strong>{" "}
                  {Number(shownPricing?.voucher_discount) > 0
                    ? "diterapkan."
                    : "valid tanpa potongan tambahan."}
                </p>
              )}
              <Feedback>{error}</Feedback>
              <div className="form-actions">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  disabled={busy}
                >
                  Kembali
                </Button>
                <Button
                  onClick={() => {
                    setError("");
                    setStep(3);
                  }}
                  disabled={busy || !shownPricing}
                >
                  Tinjau pembayaran <Icon name="arrow" />
                </Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2>Metode pembayaran</h2>
              <p>
                {mode === "api"
                  ? "Order dibuat di Laravel sebelum sesi pembayaran Midtrans diinisiasi."
                  : "Mode demo tidak akan membuka atau menginisiasi Midtrans."}
              </p>
              <div className="payment-choice selected">
                <span className="midtrans-mark">M</span>
                <span>
                  <strong>Bayar melalui Midtrans</strong>
                  <small>
                    Pilihan metode dilakukan di halaman Midtrans. Kembali ke
                    GutShoes tidak berarti pembayaran berhasil.
                  </small>
                </span>
                <Icon name="check" />
              </div>
              <div className="review-box">
                <h3>Konfirmasi berasal dari server</h3>
                <p>
                  Stok dan total divalidasi lagi saat order dibuat. Hanya
                  webhook Midtrans pada backend yang boleh mengubah pembayaran
                  menjadi berhasil.
                </p>
              </div>
              <Feedback>{error}</Feedback>

              <div className="form-actions">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  disabled={busy}
                >
                  Kembali
                </Button>
                {mode === "api" ? (
                  <Button
                    onClick={submitOrder}
                    disabled={busy}
                    aria-busy={busy}
                  >
                    {operation === "order" ? (
                      "Membuat order…"
                    ) : operation === "payment" ? (
                      "Menginisiasi Midtrans…"
                    ) : (
                      <>
                        Buat order & lanjut bayar <Icon name="arrow" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button disabled>Pembayaran belum tersedia</Button>
                )}
              </div>
            </div>
          )}
        </section>
        <OrderSummary
          cart={cart}
          pricing={shownPricing}
          source={mode}
          totalLabel="Total pembayaran"
        />
      </div>
    </main>
  );
}

export default Checkout;

