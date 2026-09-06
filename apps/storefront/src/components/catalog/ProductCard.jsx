import React from "react";
import {rupiah} from "../../lib/currency";

function ProductCard({product, onOpen}) {
  return (
    <article className="product-card">
      <button className="product-card__image" onClick={() => onOpen(product)} aria-label={`Lihat ${product.name}`}>
        {product.image ? (
          <img src={product.image} alt={product.imageAlt || product.name} loading="lazy" decoding="async" />
        ) : (
          <span className="product-image-placeholder" aria-hidden="true">Gambar belum tersedia</span>
        )}
      </button>
      <div className="product-card__meta"><span>{product.category}</span><small>{product.brand}</small></div>
      <h3><button className="product-name-button" onClick={() => onOpen(product)}>{product.name}</button></h3>
      <p>{rupiah(product.price)}</p>
      <div className="sizes-preview" aria-label="Ukuran tersedia">
        {product.sizes.slice(0, 5).map((size) => <span className={!product.stock[size] ? "sold" : ""} key={size}>{size}</span>)}
      </div>
    </article>
  );
}

export default ProductCard;

