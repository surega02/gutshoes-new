import React, {lazy, Suspense, useEffect, useRef, useState} from "react";
import {api, googleLoginUrl, isBackendUnavailable} from "./api";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import {cartKey, mapServerCart} from "./lib/cart";
import {initialGuestOrders, recoveryReference, sanitizeGuestReference, validGuestReference, writeGuestOrders} from "./lib/guestOrders";
import {isProtectedStorefrontRoute, readRoute, renderStorefrontRoute, routeHash, routeTitle} from "./routes";
import {mapCatalogProduct} from "./lib/catalog";

const AdminPanel = lazy(() => import("./ProtectedAdmin"));

function RouteLoading() {
  return (
    <main className="catalog-status" role="status" aria-live="polite">
      <span className="catalog-spinner" aria-hidden="true" />
      <p>Menyiapkan halaman…</p>
    </main>
  );
}

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
  const [cartSource, setCartSource] = useState("api");
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [cartActions, setCartActions] = useState({});
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const mainRef = useRef(null);
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const cartEpoch = useRef(0);
  const [addresses, setAddresses] = useState([]);
  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const session = await api.me();
        if (!active) return;
        setUser(session.data);
        setSessionReady(true);
        const [profile, addressList] = await Promise.all([
          api.profile(),
          api.addresses(),
        ]);
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
      } catch (error) {
        if (!active) return;
        if (error.status === 401) setSessionReady(true);
        else setSessionError("Sesi belum dapat diperiksa. Muat ulang halaman sebelum bertransaksi.");
      }
    };
    loadSession();
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
      window.scrollTo({top: 0, behavior: "instant"});
    };
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    if (!window.location.hash) window.history.replaceState(null, "", "#home");
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  useEffect(() => {
    if (sessionReady && isProtectedStorefrontRoute(page) && !user) {
      setReturnTo(page);
      window.location.hash = "#login";
    }
  }, [page, user, sessionReady]);
  useEffect(() => {
    const productName =
      page === "product"
        ? products.find((item) => item.slug === pageData.slug)?.name
        : "";
    document.title = routeTitle(route, productName);
  }, [route, page, pageData.slug, products]);
  useEffect(() => {
    mainRef.current?.focus({preventScroll: true});
  }, [page]);
  const navigate = (next, data = {}) => {
    const target = routeHash(next, data);
    if (window.location.hash === target) {
      setRoute(readRoute());
      window.scrollTo({top: 0, behavior: "instant"});
      return;
    }
    // Commit immediately: waiting for animation frames inside a view-transition
    // snapshot can stall navigation until the browser times the transition out.
    window.history.pushState(null, "", target);
    setRoute(readRoute(target));
    window.scrollTo({top: 0, behavior: "instant"});
  };
  const applyServerCart = (payload) => {
    const token = payload.guest_token || "";
    setCart(mapServerCart(payload));
    setCartSource("api");
    setCartError("");
    if (token) {
      setGuestCartToken(token);
      sessionStorage.setItem("gutshoes-guest-cart", token);
    }
    if (user && !token) {
      setGuestCartToken("");
      sessionStorage.removeItem("gutshoes-guest-cart");
    }
    return {token, cart: payload};
  };
  const ensureServerCart = async () => {
    if (!sessionReady) throw new Error("Tunggu pemeriksaan sesi selesai, lalu coba lagi.");
    const epoch = cartEpoch.current;
    const response = await (user && guestCartToken ? api.claimCart(guestCartToken) : api.cart(guestCartToken));
    if (epoch !== cartEpoch.current) throw new Error("Sesi berubah. Muat ulang keranjang.");
    return applyServerCart(response.data);
  };
  const reloadCart = async () => {
    if (!sessionReady) return;
    setCartLoading(true);
    setCartError("");
    try {
      await ensureServerCart();
    } catch (error) {
      setCartError(error.message || "Keranjang belum dapat dimuat. Coba lagi.");
    } finally {
      setCartLoading(false);
    }
  };
  useEffect(() => {
    if (!sessionReady) return;
    const epoch = ++cartEpoch.current;
    let active = true;
    setCart([]);
    setCartLoading(true);
    (user && guestCartToken ? api.claimCart(guestCartToken) : api.cart(guestCartToken))
      .then((response) => { if (active && epoch === cartEpoch.current) applyServerCart(response.data); })
      .catch((error) => { if (active) setCartError(error.message || "Keranjang belum dapat dimuat."); })
      .finally(() => { if (active) setCartLoading(false); });
    return () => { active = false; };
  }, [sessionReady, user?.id]);
  const openProduct = (p) => navigate("product", {product: p});
  const addToCart = async (product, size) => {
    const variant = product.variants.find(
      (v) => String(v.size) === String(size),
    );
    if (!sessionReady || !variant?.id) throw new Error("Produk atau sesi belum siap. Coba lagi.");
    const epoch = cartEpoch.current;
    const response = await api.addCartItem(variant.id, 1, guestCartToken);
    if (epoch === cartEpoch.current) applyServerCart(response.data);
    return "api";
  };
  const updateQty = async (item, delta) => {
    const key = cartKey(item),
      quantity = Math.max(
        1,
        Math.min(item.qty + delta, item.product.stock[item.size]),
      );
    if (quantity === item.qty) return;
    if (!sessionReady || !item.backendItemId) return;
    const epoch = cartEpoch.current;
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
      if (epoch !== cartEpoch.current) return;
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
    if (!sessionReady || !item.backendItemId) return;
    const epoch = cartEpoch.current;
    setCartActions((prev) => ({
      ...prev,
      [key]: {loading: true, type: "delete"},
    }));
    try {
      const response = await api.deleteCartItem(
        item.backendItemId,
        guestCartToken,
      );
      if (epoch !== cartEpoch.current) return;
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
      cartEpoch.current++;
      setCart([]);
      setOrder(null);
      setUser(null);
      setAddresses([]);
      setReturnTo("profile");
      navigate("home");
    } catch (error) {
      setSessionError(error.message || "Keluar akun belum berhasil. Coba lagi.");
    }
  };
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  if (page === "admin")
    return (
      <Suspense fallback={<RouteLoading />}>
        <AdminPanel
          section={pageData.section}
          navigate={(section) => navigate("admin", {section})}
          onStorefront={() => navigate("home")}
        />
      </Suspense>
    );
  const content = renderStorefrontRoute(page, {
    pageData, navigate, openProduct, products, catalogLoading, catalogError,
    loadCatalog, query, setQuery, addToCart, cart, updateQty, removeItem,
    cartSource, cartLoading, cartError, cartActions, reloadCart, createOrder,
    user, setUser, addresses, setAddresses, guestCartToken, ensureServerCart,
    onCheckoutCreated: () => { setCart([]); setCartActions({}); },
    order, guestOrders, rememberGuestOrder, login, logout, returnTo,
  });
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      {sessionError && <p role="alert" className="notice error">{sessionError}</p>}
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
        <Suspense key={page} fallback={<RouteLoading />}>{!sessionReady && (page === "checkout" || isProtectedStorefrontRoute(page)) ? <RouteLoading /> : content}</Suspense>
      </div>
      <Footer />
    </div>
  );
}
