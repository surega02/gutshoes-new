import React, {useMemo, useState} from "react";
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
  guestCartToken,
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
  const [demoOrderReady, setDemoOrderReady] = useState(false);
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
    try {
      if (cartSource !== "api" || !guestCartToken) {
        setMode("demo");
        setPricing(null);
        setAppliedVoucher(code);
        setError(
          "Cart belum tersimpan di Laravel. Quote ini hanya simulasi lokal dan tidak dapat menjadi order nyata.",
        );
        return true;
      }
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
      if (isBackendUnavailable(err)) {
        setMode("demo");
        setPricing(null);
        setAppliedVoucher(code);
        setError(
          "API Laravel belum tersedia. Checkout beralih ke simulasi lokal; tidak ada order, reservasi stok, voucher, ongkir, atau pembayaran nyata yang dibuat.",
        );
        return true;
      }
      setPricing(null);
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
    if (cartSource !== "api" || !guestCartToken) {
      setMode("demo");
      setPricing(null);
      setError(
        "Backend belum memiliki cart ini. Checkout dilanjutkan sebagai demo tanpa quote, order, stok, atau pembayaran nyata.",
      );
      setStep(2);
      setOperation("");
      return;
    }
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
      if (isBackendUnavailable(err)) {
        setMode("demo");
        setPricing(null);
        setError(
          "API Laravel belum tersedia. Anda dapat meninjau checkout demo, tetapi tidak ada transaksi nyata yang akan dibuat.",
        );
        setStep(2);
      } else {
        setError(
          messageFor(
            err,
            "Backend menolak keranjang atau alamat ini. Periksa stok dan data tujuan.",
          ),
        );
      }
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
    if (operation || !buyer || mode === "demo") return;
    setOperation("order");
    setError("");
    setDemoOrderReady(false);
    try {
      const serverCart = await ensureServerCart();
      const created = await api.checkout(
        orderPayload,
        serverCart.token,
        crypto.randomUUID(),
      );
      const accessToken = created.data.guest_access_token || "";
      const customerType = user ? "customer" : "guest";
      const orderData = {
        number: created.data.order_number,
        total: Number(created.data.grand_total),
        email: buyer.email,
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
            : await api.createCustomerPayment(orderData.number, buyer.email);
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
      navigate("payment");
    } catch (err) {
      if (isBackendUnavailable(err)) {
        setDemoOrderReady(true);
        setError(
          "Backend terputus sebelum order dibuat. Tidak ada order yang diasumsikan berhasil. Anda dapat membuka hasil simulasi tanpa pembayaran.",
        );
      } else {
        setError(
          messageFor(
            err,
            "Order ditolak backend. Stok, ongkir, voucher, dan alamat perlu diperiksa kembali.",
          ),
        );
      }
    } finally {
      setOperation("");
    }
  };
  const openDemoOrder = () => {
    const suffix = String(Date.now()).slice(-6);
    createOrder({
      number: `DEMO-${suffix}`,
      total: fallbackPricing.grand_total,
      email: buyer.email,
      source: "demo",
      paymentStatus: "demo",
    });
    navigate("payment");
  };

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
            <form onSubmit={next}>
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
                    defaultValue={
                      addresses.find((address) => address.isDefault)?.address ||
                      ""
                    }
                  />
                </label>
                <RegionFields
                  initial={addresses.find((address) => address.isDefault) || {}}
                  searchable
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
              {demoOrderReady && (
                <Button variant="secondary" onClick={openDemoOrder}>
                  Buka hasil simulasi tanpa pembayaran
                </Button>
              )}
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
                  <Button onClick={openDemoOrder}>
                    Lanjutkan simulasi <Icon name="arrow" />
                  </Button>
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

