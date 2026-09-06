import React from "react";
import {rupiah} from "../data";
import {cartKey} from "../lib/cart";
import Button from "../components/ui/Button";
import Feedback from "../components/ui/Feedback";
import Icon from "../components/ui/Icon";
import OrderSummary from "../components/checkout/OrderSummary";

function Cart({
  cart,
  updateQty,
  removeItem,
  navigate,
  cartSource,
  cartLoading,
  cartError,
  cartActions,
  retryCart,
}) {
  return (
    <main className="cart-page">
      <div className="page-title">
        <div>
          <h1>Keranjangmu</h1>
          <p>
            {cart.length
              ? `${cart.length} varian siap diperiksa`
              : "Belum ada produk di keranjang"}
          </p>
        </div>
      </div>
      <div
        className={`cart-sync-status ${cartSource}`}
        role="status"
        aria-live="polite"
      >
        <span>
          <strong>
            {cartLoading
              ? "Memuat cart dari server…"
              : cartSource === "api"
                ? "Cart server aktif"
                : "Mode demo — belum tersimpan di server"}
          </strong>
          <small>
            {cartSource === "api"
              ? "Tampilan, quote, dan order memakai cart Laravel yang sama."
              : "Jumlah, quote, dan order hanya simulasi lokal."}
          </small>
        </span>
        {cartError && (
          <Button
            variant="secondary"
            onClick={retryCart}
            disabled={cartLoading}
          >
            Coba muat ulang
          </Button>
        )}
      </div>
      {cartError && <Feedback>{cartError}</Feedback>}
      {cart.length ? (
        <div className="cart-layout">
          <section className="cart-items" aria-busy={cartLoading}>
            {cart.map((item) => {
              const action = cartActions[cartKey(item)] || {};
              const busy = Boolean(action.loading);
              return (
                <article
                  className={`cart-item ${busy ? "is-busy" : ""}`}
                  key={cartKey(item)}
                >
                  <img src={item.product.image} alt="" />
                  <div className="cart-item__info">
                    <span>{item.product.brand}</span>
                    <h2>{item.product.name}</h2>
                    <p>Ukuran {item.size}</p>
                    <strong>{rupiah(item.product.price)}</strong>
                    {action.error && (
                      <p className="cart-action-error" role="alert">
                        {action.error}
                      </p>
                    )}
                  </div>
                  <div className="quantity">
                    <button
                      onClick={() => updateQty(item, -1)}
                      disabled={busy || item.qty <= 1}
                      aria-label="Kurangi jumlah"
                    >
                      <Icon name="minus" />
                    </button>
                    <span aria-live="polite">{busy ? "…" : item.qty}</span>
                    <button
                      onClick={() => updateQty(item, 1)}
                      disabled={
                        busy || item.qty >= item.product.stock[item.size]
                      }
                      aria-label="Tambah jumlah"
                    >
                      <Icon name="plus" />
                    </button>
                  </div>
                  <button
                    className="remove"
                    onClick={() => removeItem(item)}
                    disabled={busy}
                    aria-label={`Hapus ${item.product.name}`}
                  >
                    {busy && action.type === "delete" ? (
                      <span className="action-spinner" aria-label="Menghapus" />
                    ) : (
                      <Icon name="trash" />
                    )}
                  </button>
                </article>
              );
            })}
          </section>
          <div>
            <OrderSummary cart={cart} source={cartSource} />
            <Button
              className="checkout-button"
              onClick={() => navigate("checkout")}
              disabled={cartLoading}
            >
              Lanjut ke checkout <Icon name="arrow" />
            </Button>
          </div>
        </div>
      ) : (
        !cartLoading && (
          <div className="empty">
            <Icon name="cart" size={36} />
            <h2>Keranjang masih kosong</h2>
            <p>Mulai dari koleksi sepatu yang sesuai aktivitasmu.</p>
            <Button onClick={() => navigate("catalog")}>
              Lihat semua sepatu
            </Button>
          </div>
        )
      )}
    </main>
  );
}

export default Cart;
