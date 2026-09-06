import React, {useEffect, useRef, useState} from "react";
import {rupiah} from "../lib/currency";
import Button from "../components/ui/Button";
import Feedback from "../components/ui/Feedback";
import Icon from "../components/ui/Icon";
import ProductCard from "../components/catalog/ProductCard";

function ProductDetail({product, products, addToCart, navigate, loading, error, retry}) {
  const [size, setSize] = useState(null);
  const [notice, setNotice] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const pointerStart = useRef(null);
  useEffect(() => {
    setActiveImage(0);
    setSize(null);
    setNotice("");
  }, [product?.id]);
  if (loading) return <main className="detail-page"><div className="catalog-status" role="status"><span className="catalog-spinner" /><p>Memuat detail produk…</p></div></main>;
  if (error) return <main className="detail-page"><div className="empty" role="alert"><h1>Produk belum dapat dimuat</h1><p>{error}</p><Button onClick={retry}>Coba muat lagi</Button></div></main>;
  if (!product) return <main className="detail-page"><div className="empty"><h1>Produk tidak ditemukan</h1><p>Produk ini tidak tersedia atau belum dipublikasikan.</p><Button onClick={() => navigate("catalog")}>Kembali ke katalog</Button></div></main>;

  const selectedVariant = product.variants?.find((variant) => variant.size === size);
  const displayPrice = selectedVariant?.price || product.price;
  const images = product.images?.length ? product.images : product.image ? [{id: "primary", src: product.image, alt: product.imageAlt || product.name}] : [];
  const showNavigation = images.length > 1;
  const showImage = (index) => setActiveImage((index + images.length) % images.length);
  const handleGalleryKey = (event) => {
    if (!showNavigation) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); showImage(activeImage - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showImage(activeImage + 1); }
  };
  const add = () => {
    if (!size) { setNotice("Pilih ukuran yang tersedia sebelum menambahkan produk."); return; }
    addToCart({...product, price: displayPrice}, size);
    setNotice("Produk ditambahkan ke keranjang.");
  };
  return (
    <main className="detail-page">
      <button className="back-link" onClick={() => navigate("catalog")}><Icon name="back" /> Kembali ke katalog</button>
      <div className="detail-layout">
        <div className="product-gallery" tabIndex={showNavigation ? 0 : undefined} role={showNavigation ? "region" : undefined} aria-roledescription={showNavigation ? "carousel" : undefined} aria-label={showNavigation ? `Galeri foto ${product.name}` : undefined} onKeyDown={handleGalleryKey} onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={(event) => { if (!showNavigation || pointerStart.current === null) return; const distance = event.clientX - pointerStart.current; pointerStart.current = null; if (Math.abs(distance) > 45) showImage(activeImage + (distance < 0 ? 1 : -1)); }} onPointerCancel={() => { pointerStart.current = null; }}>
          {images.length ? <div className="gallery-track" style={{transform: `translateX(-${activeImage * 100}%)`}}>{images.map((image, index) => <div className="gallery-slide" key={image.id || image.src} aria-hidden={index !== activeImage}><img src={image.src} alt={index === activeImage ? image.alt : ""} draggable="false" /></div>)}</div> : <span className="product-image-placeholder">Gambar belum tersedia</span>}
          {showNavigation && <><button className="gallery-arrow previous" type="button" onClick={() => showImage(activeImage - 1)} aria-label="Foto sebelumnya"><Icon name="back" /></button><button className="gallery-arrow next" type="button" onClick={() => showImage(activeImage + 1)} aria-label="Foto berikutnya"><Icon name="back" /></button><div className="gallery-dots" aria-label="Pilih foto produk">{images.map((image, index) => <button key={image.id || image.src} type="button" className={index === activeImage ? "active" : ""} onClick={() => showImage(index)} aria-label={`Tampilkan foto ${index + 1} dari ${images.length}`} aria-current={index === activeImage ? "true" : undefined} />)}</div></>}
        </div>
        <section className="purchase-panel">
          <p className="product-brand">{product.brand} · {product.category}</p>
          <h1>{product.name}</h1>
          <p className="price">{rupiah(displayPrice)}</p>
          {selectedVariant && <p className="variant-meta">SKU {selectedVariant.sku} · {selectedVariant.weight} gram</p>}
          {product.description && <p className="description">{product.description}</p>}
          <div className="size-heading"><strong id="size-picker-label">Pilih ukuran</strong><button disabled title="Panduan ukuran belum tersedia pada prototipe">Panduan ukuran segera</button></div>
          <div className="size-picker" role="group" aria-labelledby="size-picker-label">{product.sizes.map((itemSize) => <button key={itemSize} aria-pressed={size === itemSize} className={size === itemSize ? "active" : ""} disabled={!product.stock[itemSize]} onClick={() => { setSize(itemSize); setNotice(""); }}>{itemSize}<small>{!product.stock[itemSize] ? "Habis" : `${product.stock[itemSize]} stok`}</small></button>)}</div>
          <Feedback type={notice.includes("ditambahkan") ? "success" : "error"}>{notice}</Feedback>
          <Button className="add-button" onClick={add}>Tambah ke keranjang <Icon name="cart" /></Button>
          <div className="product-facts"><div><Icon name="package" /><span><strong>SKU per ukuran</strong>Varian diverifikasi saat checkout</span></div><div><Icon name="truck" /><span><strong>Ongkir otomatis</strong>Dihitung berdasarkan alamat dan berat</span></div></div>
        </section>
      </div>
      <section className="section related"><div className="section__heading"><div><h2>Produk lainnya</h2><p>Alternatif dari aktivitas berbeda.</p></div></div><div className="product-grid">{products.filter((item) => item.id !== product.id).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} onOpen={(selected) => navigate("product", {product: selected})} />)}</div></section>
    </main>
  );
}

export default ProductDetail;
