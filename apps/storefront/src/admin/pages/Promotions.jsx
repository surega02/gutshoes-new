import React from "react";
import {api} from "../../api";
import {rupiah} from "../../data";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import Badge from "../components/Badge";
import Empty from "../components/Empty";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";

function PromotionsPage() {
  const resource = useAdminResource(() =>
    Promise.all([
      api.adminPromotions({per_page: 100}),
      api.adminVouchers({per_page: 100}),
    ]).then(([promotions, vouchers]) => ({
      data: [
        ...serverList(promotions.data).map((item) => ({
          ...item,
          kind: "Promosi",
        })),
        ...serverList(vouchers.data).map((item) => ({
          ...item,
          kind: "Voucher",
        })),
      ],
    })),
  );
  const rows = resource.data || [];
  return (
    <>
      <PageHead section="promotions" />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <section className="adm-card adm-table-card">
          {rows.length ? (
            <div className="adm-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nama / kode</th>
                    <th>Jenis</th>
                    <th>Nilai</th>
                    <th>Berakhir</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={[item.kind, item.id].join("-")}>
                      <td>
                        <strong>{item.code || item.name}</strong>
                        <small>{item.kind}</small>
                      </td>
                      <td>{item.type}</td>
                      <td className="num">
                        {item.type === "PERCENTAGE"
                          ? item.value + "%"
                          : rupiah(Number(item.value || 0))}
                      </td>
                      <td>
                        {new Date(item.ends_at).toLocaleDateString("id-ID")}
                      </td>
                      <td>
                        <Badge tone={item.is_active ? "success" : "warning"}>
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="Belum ada promosi atau voucher tersimpan." />
          )}
        </section>
      )}
    </>
  );
}

export default PromotionsPage;
