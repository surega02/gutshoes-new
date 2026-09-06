import React, {useState} from "react";
import {api} from "../../api";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import DataToolbar from "../components/DataToolbar";
import Empty from "../components/Empty";
import OrderDrawer from "../components/OrderDrawer";
import OrdersTable from "../components/OrdersTable";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";

function OrdersPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua pesanan");
  const [selected, setSelected] = useState(null);
  const resource = useAdminResource(() => api.adminOrders({per_page: 100}));
  const rows = serverList(resource.data)
    .map((order) => ({
      raw: order,
      id: order.order_number,
      customer: order.customer_name || order.customer_email || "Guest",
      time: new Date(order.created_at).toLocaleString("id-ID"),
      total: Number(order.grand_total || 0),
      payment: order.payment?.status || "Belum ada",
      status: order.status,
    }))
    .filter((order) =>
      [order.id, order.customer]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter((order) => filter === "Semua pesanan" || order.status === filter);
  return (
    <>
      <PageHead section="orders" />
      <DataToolbar
        {...{query, setQuery, filter, setFilter}}
        options={[
          "Semua pesanan",
          "PENDING_PAYMENT",
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ]}
      />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <section className="adm-card adm-table-card">
          {rows.length ? (
            <OrdersTable rows={rows} onOpen={setSelected} />
          ) : (
            <Empty title="Pesanan tidak ditemukan" />
          )}
        </section>
      )}
      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={resource.retry}
        />
      )}
    </>
  );
}

export default OrdersPage;
