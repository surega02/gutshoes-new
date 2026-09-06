import React, {useState} from "react";
import {api} from "../../api";
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
              <table>
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
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name || "Pelanggan"}</strong>
                        <small>{item.email}</small>
                      </td>
                      <td>
                        {item.email_verified_at ? "Terverifikasi" : "Belum"}
                      </td>
                      <td>
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td>
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
    </>
  );
}

export default CustomersPage;
