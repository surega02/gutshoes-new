import React, {useState} from "react";
import {api} from "../../api";
import {rupiah} from "../../data";
import useAdminResource from "../hooks/useAdminResource";
import {productDraft, serverList} from "../lib/helpers";
import Badge from "../components/Badge";
import DataToolbar from "../components/DataToolbar";
import Empty from "../components/Empty";
import Icon from "../components/Icon";
import PageHead from "../components/PageHead";
import ProductEditor from "../components/ProductEditor";
import ResourceState from "../components/ResourceState";

function ProductsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua status");
  const [editing, setEditing] = useState(null);
  const resource = useAdminResource(() =>
    Promise.all([
      api.adminProducts({per_page: 100}),
      api.adminBrands(),
      api.adminCategories(),
      api.adminSizes(),
    ]).then(
      ([
        productsResponse,
        brandsResponse,
        categoriesResponse,
        sizesResponse,
      ]) => ({
        data: {
          products: serverList(productsResponse.data),
          brands: serverList(brandsResponse.data),
          categories: serverList(categoriesResponse.data),
          sizes: serverList(sizesResponse.data),
        },
      }),
    ),
  );
  const allRows = resource.data?.products || [];
  const rows = allRows
    .filter((item) =>
      [
        item.name,
        item.slug,
        item.brand?.name || "",
        ...(item.variants || []).map((variant) => variant.sku),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter((item) => filter === "Semua status" || item.status === filter);
  const close = () => setEditing(null);
  const refresh = () => resource.retry();
  return (
    <>
      <PageHead
        section="products"
        action="Tambah produk"
        onAction={() => setEditing(productDraft())}
      />
      <DataToolbar
        {...{query, setQuery, filter, setFilter}}
        options={["Semua status", "DRAFT", "PUBLISHED", "ARCHIVED"]}
      />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <section className="adm-card adm-table-card">
          {rows.length ? (
            <div className="adm-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Status</th>
                    <th>Varian</th>
                    <th>Kategori</th>
                    <th className="num">Harga mulai</th>
                    <th>
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <small>
                          {item.brand?.name || "Tanpa merek"} · {item.slug}
                        </small>
                      </td>
                      <td>
                        <Badge
                          tone={
                            item.status === "PUBLISHED"
                              ? "success"
                              : item.status === "ARCHIVED"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td>
                        {item.variants?.filter((variant) => variant.is_active)
                          .length || 0}{" "}
                        aktif
                      </td>
                      <td>
                        {item.categories
                          ?.map((category) => category.name)
                          .join(", ") || "—"}
                      </td>
                      <td className="num">
                        <strong>
                          {item.variants?.length
                            ? rupiah(
                                Math.min(
                                  ...item.variants.map((variant) =>
                                    Number(variant.price),
                                  ),
                                ),
                              )
                            : "—"}
                        </strong>
                      </td>
                      <td>
                        <button
                          className="adm-row-action"
                          onClick={() => setEditing(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Icon name="arrow" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Produk tidak ditemukan"
              text={
                allRows.length
                  ? "Coba ubah pencarian atau filter."
                  : "Tambahkan produk pertama untuk mulai mengelola katalog."
              }
            />
          )}
        </section>
      )}
      {editing && resource.data && (
        <ProductEditor
          product={editing.id ? editing : null}
          brands={resource.data.brands}
          categories={resource.data.categories}
          sizes={resource.data.sizes}
          onClose={() => {
            close();
            refresh();
          }}
          onSaved={refresh}
          onDeleted={() => {
            close();
            refresh();
          }}
        />
      )}
    </>
  );
}

export default ProductsPage;

