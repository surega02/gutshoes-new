import React from "react";
import {rupiah} from "../../lib/currency";

function ProductCard({product, onOpen}) {
  const href = `#product/${encodeURIComponent(product.slug || product.id)}`;
  const open = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(product);
  };
  return (
    <article className="product-card">
      <a href={href} className="product-card__image" onClick={open} aria-label={`Lihat ${product.name}`}>
        {product.image ? (
          <img src={product.image} alt={product.imageAlt || product.name} loading="lazy" decoding="async" />
        ) : (
          <span className="product-image-placeholder" aria-hidden="true">Gambar belum tersedia</span>
        )}
      </a>
      <div className="product-card__meta"><span>{product.category}</span><small>{product.brand}</small></div>
      <h3><a href={href} className="product-name-button" onClick={open}>{product.name}</a></h3>
      <p>{rupiah(product.price)}</p>
      <div className="sizes-preview" aria-label="Ukuran tersedia">
        {product.sizes.slice(0, 5).map((size) => <span className={!product.stock[size] ? "sold" : ""} key={size}>{size}</span>)}
      </div>
    </article>
  );
}

export default ProductCard;

