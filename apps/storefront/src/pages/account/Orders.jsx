import React, {useEffect, useState} from "react";
import {api} from "../../api";
import {rupiah} from "../../data";
import AccountShell from "../../components/layout/AccountShell";
import Button from "../../components/ui/Button";
import Feedback from "../../components/ui/Feedback";

export default function Orders({user, navigate, onLogout}) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setResult(null);
    setError("");
    api.orders({page, per_page: 15}).then(data => { if (active) setResult(data); })
      .catch(err => { if (active) setError(err.message || "Pesanan belum dapat dimuat."); });
    return () => { active = false; };
  }, [page, user.id, version]);
  return <AccountShell active="orders" navigate={navigate} user={user} onLogout={onLogout}>
    <div className="account-title"><div><h2>Riwayat pesanan</h2><p>Pesanan yang terhubung dengan akunmu.</p></div></div>
    <Feedback>{error}</Feedback>
    {error && <Button onClick={() => setVersion(v => v + 1)}>Coba lagi</Button>}
    {!result && !error && <p role="status">Memuat pesanan…</p>}
    {result && !result.data.length && <p>Belum ada pesanan.</p>}
    <div className="order-history">{result?.data.map(item => <article className="history-item" key={item.order_number}>
      <div><span>{new Date(item.created_at).toLocaleDateString("id-ID")}</span><h3>{item.order_number}</h3>
        <p>{item.items?.map(product => product.product_name).join(", ")}</p><small>Pembayaran · {item.payment?.status || "Belum dimulai"}</small></div>
      <div><strong>{rupiah(Number(item.grand_total))}</strong><span className="order-state">{item.status}</span>
        <button className="text-link" onClick={() => navigate("order-detail", {orderNumber: item.order_number})}>Lihat detail</button></div>
    </article>)}</div>
    {result && result.meta.last_page > 1 && <nav aria-label="Halaman pesanan">
      <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
      <span> Halaman {page} dari {result.meta.last_page} </span>
      <Button disabled={page >= result.meta.last_page} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
    </nav>}
  </AccountShell>;
}
