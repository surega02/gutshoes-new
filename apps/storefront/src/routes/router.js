const STOREFRONT_PAGES = new Set([
  "home", "catalog", "product", "cart", "checkout", "payment",
  "guest-orders", "tracking", "login", "profile", "addresses",
  "orders", "order-detail",
]);

const ADMIN_SECTIONS = new Set([
  "dashboard", "products", "catalog", "inventory", "orders",
  "customers", "promotions", "settings", "audit",
]);

const STOREFRONT_TITLES = {
  home: "Sepatu olahraga untuk setiap langkah",
  catalog: "Katalog sepatu olahraga",
  product: "Detail produk",
  cart: "Keranjang belanja",
  checkout: "Checkout",
  payment: "Status pembayaran",
  "guest-orders": "Pesanan terakhir saya",
  tracking: "Lacak pesanan",
  login: "Masuk ke akun",
  profile: "Profil saya",
  addresses: "Alamat saya",
  orders: "Riwayat pesanan",
  "order-detail": "Detail pesanan",
};

const ADMIN_TITLES = {
  dashboard: "Dashboard",
  products: "Produk",
  catalog: "Katalog",
  inventory: "Inventaris",
  orders: "Pesanan",
  customers: "Pelanggan",
  promotions: "Promosi",
  settings: "Pengaturan",
  audit: "Audit log",
};

export function readRoute(hash = window.location.hash) {
  const raw = hash.replace(/^#/, "") || "home";
  const [path, search = ""] = raw.split("?");
  const [page, encodedParameter] = path.split("/");
  const parameter = decodeURIComponent(encodedParameter || "");
  if (page === "admin") {
    return {page, data: {section: ADMIN_SECTIONS.has(parameter) ? parameter : "dashboard"}};
  }
  if (!STOREFRONT_PAGES.has(page)) return {page: "home", data: {}};
  if (page === "product") return {page, data: {slug: parameter}};
  if (page === "catalog") {
    return {page, data: {filter: new URLSearchParams(search).get("filter") || undefined}};
  }
  if (page === "order-detail") return {page, data: {orderNumber: parameter}};
  return {page, data: {}};
}

export function routeHash(page, data = {}) {
  if (page === "admin") {
    const section = ADMIN_SECTIONS.has(data.section) ? data.section : "dashboard";
    return `#admin/${section}`;
  }
  if (!STOREFRONT_PAGES.has(page)) return "#home";
  if (page === "product") {
    const slug = data.product?.slug || data.product?.id || data.slug || "";
    return `#product/${encodeURIComponent(slug)}`;
  }
  if (page === "catalog" && data.filter) {
    return `#catalog?filter=${encodeURIComponent(data.filter)}`;
  }
  if (page === "order-detail") {
    return `#order-detail/${encodeURIComponent(data.orderNumber || "")}`;
  }
  return `#${page}`;
}

export function isAdminSection(section) {
  return ADMIN_SECTIONS.has(section);
}

export function routeTitle(route, productName = "") {
  if (route.page === "admin") {
    return `${ADMIN_TITLES[route.data.section] || "Admin"} — Admin GutShoes`;
  }
  if (route.page === "product" && productName) {
    return `${productName} — GutShoes`;
  }
  if (route.page === "order-detail" && route.data.orderNumber) {
    return `Pesanan ${route.data.orderNumber} — GutShoes`;
  }
  return `${STOREFRONT_TITLES[route.page] || STOREFRONT_TITLES.home} — GutShoes`;
}
