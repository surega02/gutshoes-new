import React, {useMemo, useState} from "react";
import {api} from "../../api";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import Badge from "../components/Badge";
import DataToolbar from "../components/DataToolbar";
import Empty from "../components/Empty";
import Icon from "../components/Icon";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";
import SizeEditor from "../components/SizeEditor";

function SizesPage() {
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("Semua sistem");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const resource = useAdminResource(() => api.adminSizes());
  const sizes = useMemo(() => serverList(resource.data), [resource.data]);
  const systems = useMemo(
    () => [
      "Semua sistem",
      ...new Set(sizes.map((item) => item.system).filter(Boolean)),
    ],
    [sizes],
  );
  const rows = sizes.filter((item) => {
    const matchesQuery = [item.system, item.value, item.label]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (system === "Semua sistem" || item.system === system)
    );
  });
  const complete = (message) => {
    setEditing(null);
    setNotice(message);
    resource.retry();
  };

  return (
    <>
      <PageHead
        section="sizes"
        action="Tambah ukuran"
        onAction={() => {
          setNotice("");
          setEditing({});
        }}
      />
      {notice && (
        <div className="adm-feedback success adm-catalog-notice" role="status">
          <Icon name="check" />
          {notice}
        </div>
      )}
      <DataToolbar
        query={query}
        setQuery={setQuery}
        filter={system}
        setFilter={setSystem}
        options={systems}
        placeholder="Cari sistem, nilai, atau label…"
        searchLabel="Cari ukuran"
        filterLabel="Filter sistem ukuran"
      />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <section className="adm-card adm-table-card">
          {rows.length ? (
            <div className="adm-table-wrap">
              <table className="adm-size-table">
                <thead>
                  <tr>
                    <th>Ukuran</th>
                    <th>Sistem</th>
                    <th>Nilai</th>
                    <th>Penggunaan</th>
                    <th>
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const usageCount = Number(
                      item.product_variants_count || 0,
                    );
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.label}</strong>
                          <small>ID ukuran #{item.id}</small>
                        </td>
                        <td>
                          <Badge tone="info">{item.system}</Badge>
                        </td>
                        <td className="num adm-size-value">{item.value}</td>
                        <td>
                          {usageCount ? (
                            <span>{usageCount} varian produk</span>
                          ) : (
                            <span className="adm-unused">Belum digunakan</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="adm-row-action"
                            onClick={() => {
                              setNotice("");
                              setEditing(item);
                            }}
                            aria-label={`Edit ukuran ${item.label}`}
                          >
                            <Icon name="arrow" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={sizes.length ? "Ukuran tidak ditemukan" : "Belum ada ukuran"}
              text={
                sizes.length
                  ? "Coba ubah pencarian atau filter sistem."
                  : "Tambahkan ukuran pertama agar dapat dipilih pada varian produk."
              }
            />
          )}
        </section>
      )}
      {editing && (
        <SizeEditor
          size={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={(_, message) => complete(message)}
          onDeleted={complete}
        />
      )}
    </>
  );
}

export default SizesPage;
