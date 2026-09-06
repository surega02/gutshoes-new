import React from "react";
import {rupiah} from "../../data";
import AccountShell from "../../components/layout/AccountShell";
import Icon from "../../components/ui/Icon";

function Orders({user, order, navigate, onLogout}) {
  const demoOrders = order
    ? [
        {
          number: order.number,
          date: "22 Agustus 2026",
          status: "Diproses",
          total: order.total,
          item: "Stride Flow · 1 produk",
        },
      ]
    : [
        {
          number: "GS-20260812-00037",
          date: "12 Agustus 2026",
          status: "Diterima",
          total: 717000,
          item: "Stride Flow · 1 produk",
        },
        {
          number: "GS-20260728-00018",
          date: "28 Juli 2026",
          status: "Diterima",
          total: 631000,
          item: "Daily Court · 1 produk",
        },
      ];
  return (
    <AccountShell
      active="orders"
      navigate={navigate}
      user={user}
      onLogout={onLogout}
    >
      <div className="account-title">
        <div>
          <h2>Riwayat pesanan</h2>
          <p>Pesanan demo yang terhubung dengan akun ini.</p>
        </div>
      </div>
      <div className="order-history">
        {demoOrders.map((item) => (
          <article className="history-item" key={item.number}>
            <div>
              <span>{item.date}</span>
              <h3>{item.number}</h3>
              <p>{item.item}</p>
              <small>
                Pembayaran ·{" "}
                {item.status === "Diterima" ? "Lunas" : "Terkonfirmasi"}
              </small>
            </div>
            <div>
              <strong>{rupiah(item.total)}</strong>
              <span
                className={`order-state ${item.status === "Diterima" ? "done" : ""}`}
              >
                {item.status}
              </span>
              <button
                className="text-link"
                onClick={() =>
                  navigate("order-detail", {orderNumber: item.number})
                }
              >
                Lihat detail <Icon name="arrow" />
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="demo-note">
        Riwayat ini bersifat demonstratif. Produksi hanya boleh menampilkan
        pesanan milik pelanggan yang tervalidasi server.
      </p>
    </AccountShell>
  );
}

export default Orders;
