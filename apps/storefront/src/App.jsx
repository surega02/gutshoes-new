import React, {useEffect, useRef, useState} from "react";
import AdminPanel from "./ProtectedAdmin";
import {api, googleLoginUrl, isBackendUnavailable} from "./api";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import {cartKey, mapServerCart} from "./lib/cart";
import {initialGuestOrders, recoveryReference, sanitizeGuestReference, validGuestReference, writeGuestOrders} from "./lib/guestOrders";
import {isProtectedStorefrontRoute, readRoute, renderStorefrontRoute, routeHash} from "./routes";
import {mapCatalogProduct} from "./lib/catalog";

export default function App() {
  const [route, setRoute] = useState(() => readRoute());
  const {page, data: pageData} = route;
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(() =>
    recoveryReference
      ? {...recoveryReference, source: "api", customerType: "guest"}
      : null,
  );
  const [returnTo, setReturnTo] = useState("profile");
  const [guestOrders, setGuestOrders] = useState(initialGuestOrders);
  const [guestCartToken, setGuestCartToken] = useState(
    () => sessionStorage.getItem("gutshoes-guest-cart") || "",
  );
  const [cartSource, setCartSource] = useState(() =>
    sessionStorage.getItem("gutshoes-guest-cart") ? "api" : "demo",
  );
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [cartActions, setCartActions] = useState({});
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const mainRef = useRef(null);
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  useEffect(() => {
    let active = true;
    Promise.all([api.me(), api.profile(), api.addresses()])
      .then(([session, profile, addressList]) => {
        if (!active) return;
        setUser({
          ...session.data,
          phone: profile.data.phone || "",
          created: "—",
          updated: "—",
        });
        setAddresses(
          addressList.data.map((a) => ({
            id: a.id,
            label: a.label,
            recipient: a.recipient_name,
            phone: a.phone,
            address: a.address_line,
            city: a.city,
            province: a.province,
            district: a.district,
            provinceCode: a.province_code,
            regencyCode: a.regency_code,
            districtCode: a.district_code,
            villageCode: a.village_code,
            postal: a.postal_code,
            isDefault: a.is_default,
          })),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const loadCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const response = await api.catalog({per_page: 48});
      setProducts((response.data || []).map(mapCatalogProduct));
    } catch (error) {
      setProducts([]);
      setCatalogError(error.message || "Katalog produk belum dapat dimuat.");
    } finally {
      setCatalogLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    api.catalog({per_page: 48})
      .then((response) => {
        if (!active) return;
        setProducts((response.data || []).map(mapCatalogProduct));
        setCatalogError("");
      })
      .catch((error) => {
        if (!active) return;
        setProducts([]);
        setCatalogError(error.message || "Katalog produk belum dapat dimuat.");
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const sync = () => {
      setRoute(readRoute());
      window.scrollTo({top: 0, behavior: "smooth"});
    };
    window.addEventListener("hashchange", sync);
    if (!window.location.hash) window.history.replaceState(null, "", "#home");
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (isProtectedStorefrontRoute(page) && !user) {
      setReturnTo(page);
      window.location.hash = "#login";
    }
  }, [page, user]);
  useEffect(() => {
    mainRef.current?.focus();
  }, [page]);
  const navigate = (next, data = {}) => {
    const target = routeHash(next, data);
    if (window.location.hash === target) {
      setRoute(readRoute());
      window.scrollTo({top: 0, behavior: "smooth"});
    } else window.location.hash = target;
  };
  const applyServerCart = (payload) => {
    const token = payload.guest_token || guestCartToken;
    setCart(mapServerCart(payload));
    setCartSource("api");
    setCartError("");
    if (token) {
      setGuestCartToken(token);
      sessionStorage.setItem("gutshoes-guest-cart", token);
    }
    return {token, cart: payload};
  };
  const ensureServerCart = async () => {
    if (!guestCartToken)
      throw new Error("Cart demo belum memiliki token server.");
    const response = await api.cart(guestCartToken);
    return applyServerCart(response.data);
  };
  const reloadCart = async () => {
    if (!guestCartToken) return;
    setCartLoading(true);
    setCartError("");
    try {
      await ensureServerCart();
    } catch (error) {
      if (isBackendUnavailable(error)) {
        setCartSource("demo");
        setCartError(
          "API Laravel belum tersedia. Cart dipertahankan sebagai demo lokal dan tidak dipakai untuk transaksi nyata.",
        );
      } else
        setCartError(
          error.message || "Cart server belum dapat dimuat. Coba lagi.",
        );
    } finally {
      setCartLoading(false);
    }
  };
  useEffect(() => {
    if (guestCartToken) reloadCart();
  }, []);
  const openProduct = (p) => navigate("product", {product: p});
  const addToCart = async (product, size) => {
    const variant = product.variants.find(
      (v) => String(v.size) === String(size),
    );
    if (!variant?.id) return "demo";
    try {
      const response = await api.addCartItem(variant.id, 1, guestCartToken);
      applyServerCart(response.data);
      return "api";
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
    }
    setCartSource("demo");
    setCartError(
      "API Laravel belum tersedia. Perubahan cart hanya disimpan selama halaman ini terbuka.",
    );
    setCart((prev) => {
      const ix = prev.findIndex(
        (i) => i.product.id === product.id && i.size === size,
      );
      if (ix >= 0)
        return prev.map((i, n) =>
          n === ix ? {...i, qty: Math.min(i.qty + 1, product.stock[size])} : i,
        );
      return [...prev, {product, size, qty: 1}];
    });
    return "demo";
  };
  const updateQty = async (item, delta) => {
    const key = cartKey(item),
      quantity = Math.max(
        1,
        Math.min(item.qty + delta, item.product.stock[item.size]),
      );
    if (quantity === item.qty) return;
    if (cartSource !== "api" || !item.backendItemId || !guestCartToken) {
      setCart((prev) =>
        prev.map((i) => (cartKey(i) === key ? {...i, qty: quantity} : i)),
      );
      return;
    }
    setCartActions((prev) => ({
      ...prev,
      [key]: {loading: true, type: "quantity"},
    }));
    try {
      const response = await api.updateCartItem(
        item.backendItemId,
        quantity,
        guestCartToken,
      );
      applyServerCart(response.data);
      setCartActions((prev) => ({...prev, [key]: {}}));
    } catch (error) {
      const message = isBackendUnavailable(error)
        ? "Backend terputus. Jumlah tidak diubah; coba lagi saat API tersedia."
        : error.message || "Jumlah ditolak server.";
      setCartActions((prev) => ({...prev, [key]: {error: message}}));
    }
  };
  const removeItem = async (item) => {
    const key = cartKey(item);
    if (cartSource !== "api" || !item.backendItemId || !guestCartToken) {
      setCart((prev) => prev.filter((i) => cartKey(i) !== key));
      return;
    }
    setCartActions((prev) => ({
      ...prev,
      [key]: {loading: true, type: "delete"},
    }));
    try {
      const response = await api.deleteCartItem(
        item.backendItemId,
        guestCartToken,
      );
      applyServerCart(response.data);
      setCartActions((prev) => ({...prev, [key]: {}}));
    } catch (error) {
      const message = isBackendUnavailable(error)
        ? "Backend terputus. Item belum dihapus; coba lagi saat API tersedia."
        : error.message || "Item belum dapat dihapus.";
      setCartActions((prev) => ({...prev, [key]: {error: message}}));
    }
  };
  const rememberGuestOrder = (reference) => {
    if (!validGuestReference(reference)) return;
    setGuestOrders((previous) => {
      const normalized = sanitizeGuestReference({
        ...reference,
        createdAt: reference.createdAt || new Date().toISOString(),
      });
      const existing = previous.find(
        (item) => item.number === normalized.number,
      );
      const merged = existing ? {...existing, ...normalized} : normalized;
      if (existing && JSON.stringify(existing) === JSON.stringify(merged))
        return previous;
      const next = [
        merged,
        ...previous.filter((item) => item.number !== normalized.number),
      ].slice(0, 10);
      writeGuestOrders(next);
      return next;
    });
  };
  const createOrder = (created) => {
    setOrder(created);
    if (created?.source === "api" && created.number && created.accessToken)
      rememberGuestOrder(created);
  };
  const login = () => {
    window.location.assign(googleLoginUrl);
  };
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setAddresses([]);
      setReturnTo("profile");
      navigate("home");
    }
  };
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  if (page === "admin")
    return (
      <AdminPanel
        section={pageData.section}
        navigate={(section) => navigate("admin", {section})}
        onStorefront={() => navigate("home")}
      />
    );
  const content = renderStorefrontRoute(page, {
    pageData, navigate, openProduct, products, catalogLoading, catalogError,
    loadCatalog, query, setQuery, addToCart, cart, updateQty, removeItem,
    cartSource, cartLoading, cartError, cartActions, reloadCart, createOrder,
    user, setUser, addresses, setAddresses, guestCartToken, ensureServerCart,
    order, guestOrders, rememberGuestOrder, login, logout, returnTo,
  });
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      <Header
        cartCount={cartCount}
        navigate={navigate}
        query={query}
        setQuery={setQuery}
        user={user}
        page={page}
        categories={[...new Set(products.map((product) => product.category))]}
      />
      <div id="main" className="main-focus" ref={mainRef} tabIndex="-1">
        {content}
      </div>
      <Footer />
    </div>
  );
}
