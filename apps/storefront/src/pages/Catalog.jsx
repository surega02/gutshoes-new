import React, {useEffect, useMemo, useState} from "react";
import ProductCard from "../components/catalog/ProductCard";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import {CatalogError, CatalogLoading} from "./Home";

function Catalog({query, setQuery, openProduct, initialFilter, products, loading, error, retry}) {
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))], [products]);
  const [category, setCategory] = useState(initialFilter || "Semua");
  const [sort, setSort] = useState("newest");
  const [priceBand, setPriceBand] = useState("all");
  const [selectedSize, setSelectedSize] = useState(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  useEffect(() => setCategory(initialFilter || "Semua"), [initialFilter]);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = products.filter((p) => {
      const matchesPrice =
        priceBand === "all" ||
        (priceBand === "under" && p.price < 600000) ||
        (priceBand === "mid" && p.price >= 600000 && p.price <= 800000) ||
        (priceBand === "over" && p.price > 800000);
      return (
        (category === "Semua" || p.category === category) &&
        `${p.name} ${p.brand} ${p.category} ${p.variants.map((v) => v.sku).join(" ")}`
          .toLowerCase()
          .includes(q) &&
        matchesPrice &&
        (!selectedSize || p.stock[selectedSize] > 0)
      );
    });
    return [...list].sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : b.id - a.id,
    );
  }, [query, category, priceBand, selectedSize, sort]);
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
        {["Semua", ...categories].map((c) => (
          <label key={c}>
            <input
              type="radio"
              name="category"
              checked={category === c}
              onChange={() => setCategory(c)}
            />
            <span>{c}</span>
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
            onClick={() => {
              setQuery("");
              setCategory("Semua");
              setPriceBand("all");
              setSelectedSize(null);
            }}
          >
            Reset semua filter
          </button>
          <h1>Temukan sepatu untuk aktivitasmu</h1>
          <p aria-live="polite">{filtered.length} produk ditampilkan</p>
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
              <option value="low">Harga terendah</option>
              <option value="high">Harga tertinggi</option>
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
        <section>
          {loading ? (
            <CatalogLoading label="Memuat katalog produk…" />
          ) : error ? (
            <CatalogError message={error} retry={retry} />
          ) : filtered.length ? (
            <div className="product-grid product-grid--catalog">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={openProduct} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="search" size={34} />
              <h2>Produk belum ditemukan</h2>
              <p>
                Coba hapus kata pencarian atau ubah filter harga dan ukuran.
              </p>
              <Button
                onClick={() => {
                  setQuery("");
                  setCategory("Semua");
                  setPriceBand("all");
                  setSelectedSize(null);
                }}
              >
                Reset pencarian dan filter
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Catalog;

