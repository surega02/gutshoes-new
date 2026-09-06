import React, {useState} from "react";
import {api} from "../../api";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import DataToolbar from "../components/DataToolbar";
import Empty from "../components/Empty";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";

function AuditPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua tindakan");
  const resource = useAdminResource(() => api.adminAuditLogs({per_page: 100}));
  const rows = serverList(resource.data).filter((item) =>
    [item.action, item.entity_type || ""]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead section="audit" />
      <DataToolbar
        {...{query, setQuery, filter, setFilter}}
        options={["Semua tindakan"]}
      />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <section className="adm-card adm-table-card">
          {rows.length ? (
            <div className="adm-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Admin</th>
                    <th>Tindakan</th>
                    <th>Objek</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {new Date(item.created_at).toLocaleString("id-ID")}
                      </td>
                      <td>{item.admin_id || "Sistem"}</td>
                      <td>
                        <strong>{item.action}</strong>
                      </td>
                      <td>
                        {item.entity_type
                          ? item.entity_type + " #" + (item.entity_id || "—")
                          : "—"}
                      </td>
                      <td>
                        <code>{item.ip_address || "—"}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="Belum ada mutasi admin yang tercatat." />
          )}
        </section>
      )}
    </>
  );
}

export default AuditPage;
