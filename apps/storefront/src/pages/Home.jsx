import React from "react";
import heroRunning from "../assets/products/hero-running.webp";
import ProductCard from "../components/catalog/ProductCard";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";

function Home({navigate, openProduct, products, loading, error, retry}) {
  const categories = [
    ...new Map(
      products.flatMap((product) =>
        product.categories.map((category) => [
          category.slug,
          {...category, image: product.image},
        ]),
      ),
    ).values(),
  ];

  return (
    <main>
      <section className="hero">
        <div className="hero__copy">
          <h1>Sepatu olahraga untuk langkah sehari-hari.</h1>
          <p>Temukan pasangan yang sesuai aktivitas, ukuran, dan anggaranmu.</p>
          <Button onClick={() => navigate("catalog")}>
            Belanja sekarang <Icon name="arrow" />
          </Button>
        </div>
        <div className="hero__visual">
          <span className="hero__mark" />
          <img src={heroRunning} alt="Sepatu lari berwarna biru navy" />
        </div>
      </section>

      {!loading && !error && categories.length > 0 && (
        <section className="category-strip" aria-label="Belanja berdasarkan aktivitas">
          {categories.slice(0, 6).map((category) => (
            <button key={category.slug} onClick={() => navigate("catalog", {filter: category.name})}>
              {category.image ? <img src={category.image} alt="" /> : <span className="product-image-placeholder" aria-hidden="true" />}
              <span>
                <strong>{category.name}</strong>
                <small>Lihat pilihan</small>
              </span>
              <Icon name="chevron" />
            </button>
          ))}
        </section>
      )}

      <section className="section">
        <div className="section__heading">
          <div>
            <h2>Pilihan untukmu</h2>
            <p>Harga, ukuran, dan stok terbaru dari katalog GutShoes.</p>
          </div>
          <button className="text-link" onClick={() => navigate("catalog")}>
            Lihat semua <Icon name="arrow" />
          </button>
        </div>
        {loading ? (
          <CatalogLoading label="Memuat produk terbaru…" />
        ) : error ? (
          <CatalogError message={error} retry={retry} />
        ) : products.length ? (
          <div className="product-grid">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} onOpen={openProduct} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>Produk belum tersedia</h2>
            <p>Katalog belum memiliki produk yang dipublikasikan.</p>
          </div>
        )}
      </section>

      <section className="confidence">
        <div><Icon name="shield" size={28} /><h3>Informasi yang bisa diperiksa</h3><p>Harga, ukuran, dan ketersediaan ditampilkan per varian.</p></div>
        <div><Icon name="truck" size={28} /><h3>Biaya terlihat sebelum bayar</h3><p>Ongkir dan potongan dirinci di ringkasan checkout.</p></div>
        <div><Icon name="package" size={28} /><h3>Pesanan mudah dilacak</h3><p>Pembeli tamu dapat membuka kembali pesanan melalui tautan pemulihan.</p></div>
      </section>
    </main>
  );
}

export function CatalogLoading({label}) {
  return <div className="catalog-status" role="status"><span className="catalog-spinner" /><p>{label}</p></div>;
}

export function CatalogError({message, retry}) {
  return <div className="empty" role="alert"><Icon name="package" size={34} /><h2>Katalog belum dapat dimuat</h2><p>{message}</p><Button onClick={retry}>Coba muat lagi</Button></div>;
}

export default Home;
