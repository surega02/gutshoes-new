import React from "react";
import {api} from "../../api";
import {rupiah} from "../../data";
import useAdminResource from "../hooks/useAdminResource";

import Metric from "../components/Metric";
import Icon from "../components/Icon";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";

function Dashboard({navigate}) {
  const resource = useAdminResource(api.dashboard);
  const data = resource.data || {};
  const orders = data.orders || {};
  return (
    <>
      <PageHead section="dashboard" />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <>
          <section className="adm-metrics">
            <Metric
              label="Pendapatan terbayar"
              value={rupiah(Number(data.revenue?.paid_total || 0))}
              delta="Akumulasi pesanan terkonfirmasi"
            />
            <Metric
              label="Menunggu pembayaran"
              value={orders.pending_payment || 0}
              delta="Belum dibayar"
            />
            <Metric
              label="Perlu diproses"
              value={(orders.paid || 0) + (orders.processing || 0)}
              delta="Lunas atau sedang diproses"
            />
            <Metric
              label="Stok rendah"
              value={data.low_stock_count || 0}
              delta={"Ambang " + (data.low_stock_threshold || 0) + " unit"}
            />
          </section>
          <section className="adm-card adm-priority">
            <div className="adm-card-head">
              <div>
                <h2>Fokus operasional</h2>
                <p>Data langsung dari server.</p>
              </div>
            </div>
            <button onClick={() => navigate("orders")}>
              <span className="adm-priority-icon info">
                <Icon name="orders" />
              </span>
              <span>
                <strong>Kelola pesanan aktif</strong>
                <small>
                  {orders.paid || 0} pesanan lunas menunggu tindak lanjut
                </small>
              </span>
              <b>{orders.paid || 0}</b>
              <Icon name="arrow" />
            </button>
            <button onClick={() => navigate("inventory")}>
              <span className="adm-priority-icon warning">
                <Icon name="warehouse" />
              </span>
              <span>
                <strong>Periksa stok rendah</strong>
                <small>
                  Ambang peringatan {data.low_stock_threshold || 0} unit
                </small>
              </span>
              <b>{data.low_stock_count || 0}</b>
              <Icon name="arrow" />
            </button>
          </section>
        </>
      )}
    </>
  );
}

export default Dashboard;
