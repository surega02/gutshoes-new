import React, {useEffect, useState} from "react";
import ProductCard from "../components/catalog/ProductCard";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import {CatalogError, CatalogLoading} from "./Home";
import {useCatalog} from "../lib/useCatalog";

function Catalog({query, setQuery, openProduct, initialFilter}) {
  const [category, setCategory] = useState(initialFilter || "");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("newest");
  const [priceBand, setPriceBand] = useState("all");
  const [selectedSize, setSelectedSize] = useState(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [search, setSearch] = useState(query.trim());
  const [pagination, setPagination] = useState({key: "", page: 1});
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const filterKey = JSON.stringify([query.trim(), category, brand, sort, priceBand, selectedSize]);
  useEffect(() => setPagination({key: filterKey, page: 1}), [filterKey]);
  const page = pagination.key === filterKey ? pagination.page : 1;
  const params = {page, per_page: 12, sort, search};
  if (category) params.category = category;
  if (brand) params.brand = brand;
  if (selectedSize) params.size = selectedSize;
  if (priceBand === "under") params.max_price = 599999;
  if (priceBand === "mid") { params.min_price = 600000; params.max_price = 800000; }
  if (priceBand === "over") params.min_price = 800001;
  const {products, meta, filters: options, loading: fetching, error: failure, retry} = useCatalog(params);
  useEffect(() => {
    if (meta && meta.current_page > meta.last_page) setPagination({key: filterKey, page: meta.last_page});
  }, [meta?.current_page, meta?.last_page, filterKey]);
  const loading = fetching || search !== query.trim();
  const error = failure?.message;
  const reset = () => {
    setQuery(""); setSearch(""); setCategory(""); setBrand("");
    setPriceBand("all"); setSelectedSize(null); setPagination({key: "", page: 1});
  };
  const goToPage = (next) => {
    setPagination({key: filterKey, page: next});
    window.scrollTo({top: 0, behavior: "instant"});
  };
  const filters = (
    <div className="filters">
      <div className="filters__head">
        <h2>Filter</h2>
        <button
          onClick={() => setMobileFilters(false)}
          aria-label="Tutup filter"
        >
          <Icon name="close" />
        </button>
      </div>
      <fieldset>
        <legend>Aktivitas</legend>
        {[{slug: "", name: "Semua"}, ...(options?.categories || [])].map((c) => (
          <label key={c.slug}>
            <input
              type="radio"
              name="category"
              checked={category === c.slug || category === c.name}
              onChange={() => setCategory(c.slug)}
            />
            <span>{c.name}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Brand</legend>
        {[{slug: "", name: "Semua brand"}, ...(options?.brands || [])].map((item) => (
          <label key={item.slug}>
            <input type="radio" name="brand" checked={brand === item.slug} onChange={() => setBrand(item.slug)} />
            <span>{item.name}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Rentang harga</legend>
        {[
          ["all", "Semua harga"],
          ["under", "Di bawah Rp600.000"],
          ["mid", "Rp600.000–Rp800.000"],
          ["over", "Di atas Rp800.000"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="price"
              value={value}
              checked={priceBand === value}
              onChange={() => setPriceBand(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Ukuran tersedia</legend>
        <div className="size-filter">
          {[36, 37, 38, 39, 40, 41, 42, 43, 44].map((s) => (
            <button
              type="button"
              aria-pressed={selectedSize === s}
              className={selectedSize === s ? "active" : ""}
              onClick={() => setSelectedSize(selectedSize === s ? null : s)}
              key={s}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
  return (
    <main className="catalog-page">
      <div className="page-title">
        <div>
          <button
            className="back-link"
            onClick={reset}
          >
            Reset semua filter
          </button>
          <h1>Temukan sepatu untuk aktivitasmu</h1>
          <p aria-live="polite">{loading ? "Memuat hasil…" : error ? "Hasil belum tersedia" : `${products.length} dari ${meta?.total || 0} produk ditampilkan`}</p>
        </div>
        <div className="catalog-actions">
          <Button
            variant="secondary"
            className="mobile-filter"
            onClick={() => setMobileFilters(true)}
            aria-expanded={mobileFilters}
          >
            <Icon name="filter" /> Filter
          </Button>
          <label>
            Urutkan{" "}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Terbaru</option>
              <option value="best_selling">Terlaris</option>
              <option value="price_asc">Harga terendah</option>
              <option value="price_desc">Harga tertinggi</option>
            </select>
          </label>
        </div>
      </div>
      <div className="catalog-layout">
        {mobileFilters && (
          <button
            className="filter-scrim"
            aria-label="Tutup filter"
            onClick={() => setMobileFilters(false)}
          />
        )}
        <aside
          className={mobileFilters ? "filter-drawer open" : "filter-drawer"}
          aria-label="Filter katalog"
        >
          {filters}
        </aside>
        <section aria-label="Hasil katalog" aria-busy={loading}>
          {loading ? (
            <CatalogLoading label="Memuat katalog produk…" />
          ) : error ? (
            <CatalogError message={error} retry={retry} />
          ) : products.length ? (
            <div className="product-grid product-grid--catalog">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={openProduct} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="search" size={34} />
              <h2>Produk belum ditemukan</h2>
              <p>
                Coba hapus kata pencarian atau ubah filter brand, aktivitas, harga, dan ukuran.
              </p>
              <Button
                onClick={reset}
              >
                Reset pencarian dan filter
              </Button>
            </div>
          )}
          {!loading && !error && meta?.last_page > 1 && (
            <nav className="catalog-pagination" aria-label="Halaman katalog">
              <Button variant="secondary" disabled={meta.current_page <= 1} onClick={() => goToPage(meta.current_page - 1)}>Sebelumnya</Button>
              <span aria-live="polite">Halaman {meta.current_page} dari {meta.last_page}</span>
              <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => goToPage(meta.current_page + 1)}>Berikutnya</Button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

export default Catalog;

