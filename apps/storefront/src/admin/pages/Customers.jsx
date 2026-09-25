import React, {useState} from "react";
import {api} from "../../api";
import {rupiah} from "../../data";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import Badge from "../components/Badge";
import DataToolbar from "../components/DataToolbar";
import Empty from "../components/Empty";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";

function CustomersPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua pelanggan");
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const openDetail = async (id) => {
    setDetailError("");
    try { setDetail((await api.adminCustomer(id)).data); }
    catch (error) { setDetailError(error.message || "Detail pelanggan gagal dimuat."); }
  };
  const resource = useAdminResource(() => api.adminCustomers({per_page: 100}));
  const rows = serverList(resource.data).filter((item) =>
    [item.name || "", item.email]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead section="customers" />
      <DataToolbar
        {...{query, setQuery, filter, setFilter}}
        options={["Semua pelanggan"]}
      />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <section className="adm-card adm-table-card">
          {rows.length ? (
            <div className="adm-table-wrap">
              <table className="adm-responsive-table">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>Verifikasi email</th>
                    <th>Bergabung</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} onClick={() => openDetail(item.id)} tabIndex="0">
                      <td data-label="Pelanggan">
                        <strong>{item.name || "Pelanggan"}</strong>
                        <small>{item.email}</small>
                      </td>
                      <td data-label="Verifikasi email">
                        {item.email_verified_at ? "Terverifikasi" : "Belum"}
                      </td>
                      <td data-label="Bergabung">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td data-label="Status">
                        <Badge tone="success">Aktif</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="Belum ada pelanggan tersimpan." />
          )}
        </section>
      )}
      {detailError && <p role="alert">{detailError}</p>}
      {detail && (
        <div className="adm-overlay" onClick={() => setDetail(null)}>
          <aside className="adm-drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header><div><small>PELANGGAN</small><h2>{detail.customer?.name || "Pelanggan"}</h2></div><button onClick={() => setDetail(null)}>x</button></header>
            <section><h3>Kontak</h3><p>{detail.customer?.email}<br />{detail.customer?.customer_profile?.phone || "Telepon belum tersedia"}</p></section>
            <section><h3>Ringkasan</h3><div className="adm-line-item"><span>Jumlah pesanan<small>{detail.summary?.order_count || 0}</small></span><strong>{rupiah(Number(detail.summary?.paid_total || 0))}</strong></div></section>
            <section><h3>Alamat</h3>{detail.customer?.addresses?.length ? detail.customer.addresses.map((address) => <p key={address.id}>{address.label}: {address.address_line}, {address.district}, {address.city} {address.postal_code}</p>) : <p>Belum ada alamat.</p>}</section>
            <section><h3>Pesanan terakhir</h3>{detail.orders?.length ? detail.orders.map((order) => <div className="adm-line-item" key={order.id}><span>{order.order_number}<small>{order.status}</small></span><strong>{rupiah(Number(order.grand_total || 0))}</strong></div>) : <p>Belum ada pesanan.</p>}</section>
          </aside>
        </div>
      )}
    </>
  );
}

export default CustomersPage;
