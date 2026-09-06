import React from "react";
import {rupiah} from "../../data";

function OrderSummary({
  cart,
  shipping = 0,
  voucher = 0,
  pricing = null,
  source = "demo",
  totalLabel = "Total",
}) {
  const localSubtotal = cart.reduce(
    (sum, i) => sum + i.product.price * i.qty,
    0,
  );
  const subtotal = Number(pricing?.subtotal ?? localSubtotal);
  const shippingFee = Number(pricing?.shipping_fee ?? shipping);
  const voucherValue = Number(pricing?.voucher_discount ?? voucher);
  const total = Number(
    pricing?.grand_total ?? subtotal + shippingFee - voucherValue,
  );
  return (
    <aside className="order-summary">
      <h2>Ringkasan pesanan</h2>
      <div className="summary-lines">
        <span>
          Subtotal <b>{rupiah(subtotal)}</b>
        </span>
        {shippingFee > 0 && (
          <span>
            Pengiriman <b>{rupiah(shippingFee)}</b>
          </span>
        )}
        {voucherValue > 0 && (
          <span>
            Potongan voucher <b className="discount">−{rupiah(voucherValue)}</b>
          </span>
        )}
      </div>
      <div className="summary-total">
        <span>{totalLabel}</span>
        <strong>{rupiah(total)}</strong>
      </div>
      <small>
        {source === "api" && pricing
          ? "Total ini berasal dari validasi API Laravel."
          : "Nilai ini hanya simulasi frontend dan bukan tagihan."}
      </small>
    </aside>
  );
}

export default OrderSummary;
