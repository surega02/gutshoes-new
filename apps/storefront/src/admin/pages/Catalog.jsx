import React, {useState} from "react";
import {api} from "../../api";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import Badge from "../components/Badge";
import CatalogEditor from "../components/CatalogEditor";
import Empty from "../components/Empty";
import Icon from "../components/Icon";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";

function CatalogPage() {
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const resource = useAdminResource(() =>
    Promise.all([api.adminCategories(), api.adminBrands()]).then(
      ([categories, brands]) => ({
        data: {
          categories: serverList(categories.data),
          brands: serverList(brands.data),
        },
      }),
    ),
  );
  const complete = (message) => {
    setEditing(null);
    setNotice(message);
    resource.retry();
  };
  const open = (kind, item = null) => {
    setNotice("");
    setEditing({kind, item});
  };
  const categoryParent = (item) =>
    item.parent?.name ||
    resource.data.categories.find((category) => category.id === item.parent_id)
      ?.name;
  return (
    <>
      <PageHead section="catalog" />
      {notice && (
        <div className="adm-feedback success adm-catalog-notice" role="status">
          <Icon name="check" />
          {notice}
        </div>
      )}
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <div className="adm-two-col">
          <section className="adm-card adm-list-card">
            <div className="adm-card-head">
              <div>
                <h2>Kategori</h2>
                <p>{resource.data.categories.length} kategori dari server</p>
              </div>
              <button onClick={() => open("category")}>
                <Icon name="plus" /> Tambah
              </button>
            </div>
            {resource.data.categories.length ? (
              resource.data.categories.map((item) => (
                <div className="adm-simple-row" key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {categoryParent(item)
                        ? `Induk: ${categoryParent(item)} · `
                        : ""}
                      {item.slug}
                    </small>
                  </span>
                  <Badge tone="success">Aktif</Badge>
                  <button
                    onClick={() => open("category", item)}
                    aria-label={`Edit kategori ${item.name}`}
                  >
                    Edit
                  </button>
                </div>
              ))
            ) : (
              <Empty
                title="Belum ada kategori"
                text="Tambahkan kategori pertama untuk mengelompokkan produk."
              />
            )}
          </section>
          <section className="adm-card adm-list-card">
            <div className="adm-card-head">
              <div>
                <h2>Merek</h2>
                <p>{resource.data.brands.length} merek dari server</p>
              </div>
              <button onClick={() => open("brand")}>
                <Icon name="plus" /> Tambah
              </button>
            </div>
            {resource.data.brands.length ? (
              resource.data.brands.map((item) => (
                <div className="adm-simple-row" key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.slug}</small>
                  </span>
                  <Badge tone="success">Aktif</Badge>
                  <button
                    onClick={() => open("brand", item)}
                    aria-label={`Edit merek ${item.name}`}
                  >
                    Edit
                  </button>
                </div>
              ))
            ) : (
              <Empty
                title="Belum ada merek"
                text="Tambahkan merek pertama sebelum membuat produk."
              />
            )}
          </section>
        </div>
      )}
      {editing && resource.data && (
        <CatalogEditor
          kind={editing.kind}
          item={editing.item}
          categories={resource.data.categories}
          onClose={() => setEditing(null)}
          onSaved={(_, message) => complete(message)}
          onDeleted={complete}
        />
      )}
    </>
  );
}

export default CatalogPage;
