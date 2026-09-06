import React from "react";
import logoGutShoes from "../../assets/logo-gutshoes.png";
import Icon from "../ui/Icon";

function Header({cartCount, navigate, query, setQuery, user, page, categories}) {
  return (
    <>
      <header className="header">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Ke beranda GutShoes"
        >
          <img src={logoGutShoes} alt="GutShoes" />
        </button>
        <label className="search">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate("catalog")}
            placeholder="Cari nama sepatu, merek, atau SKU"
            aria-label="Cari produk"
          />
        </label>
        <nav className="utility" aria-label="Menu pengguna">
          {user?.role === "ADMIN" && (
            <button
              className="admin-access"
              onClick={() => navigate("admin", {section: "dashboard"})}
              aria-label="Buka admin panel"
            >
              <Icon name="shield" />
              <span>Admin panel</span>
            </button>
          )}
          <button
            className="orders-button"
            onClick={() => navigate("guest-orders")}
            aria-label="Buka pesanan saya"
          >
            <Icon name="package" />
            <span>Pesanan saya</span>
          </button>
          <button
            className="account-button"
            onClick={() => navigate(user ? "profile" : "login")}
            aria-label={user ? `Buka profil ${user.name}` : "Masuk ke akun"}
          >
            {user ? (
              <span className="account-avatar" aria-hidden="true">
                {user.name.charAt(0)}
              </span>
            ) : (
              <Icon name="user" />
            )}
            <span>{user ? user.name.split(" ")[0] : "Masuk"}</span>
          </button>
          <button
            className="cart-button"
            onClick={() => navigate("cart")}
            aria-label={`Keranjang, ${cartCount} barang`}
          >
            <Icon name="cart" />
            <span>Keranjang</span>
            {cartCount > 0 && <b aria-hidden="true">{cartCount}</b>}
          </button>
        </nav>
      </header>
      <nav className="nav" aria-label="Navigasi utama">
        <button
          className={page === "home" ? "active" : ""}
          aria-current={page === "home" ? "page" : undefined}
          onClick={() => navigate("home")}
        >
          Beranda
        </button>
        <button
          className={page === "catalog" ? "active" : ""}
          aria-current={page === "catalog" ? "page" : undefined}
          onClick={() => navigate("catalog")}
        >
          Semua sepatu
        </button>
        {categories.slice(0, 4).map((c) => (
          <button
            key={c}
            onClick={() => {
              setQuery(c);
              navigate("catalog");
            }}
          >
            {c}
          </button>
        ))}
      </nav>
    </>
  );
}

export default Header;


