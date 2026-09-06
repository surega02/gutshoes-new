const STOREFRONT_PAGES = new Set([
  "home", "catalog", "product", "cart", "checkout", "payment",
  "guest-orders", "tracking", "login", "profile", "addresses",
  "orders", "order-detail",
]);

const ADMIN_SECTIONS = new Set([
  "dashboard", "products", "catalog", "inventory", "orders",
  "customers", "promotions", "settings", "audit",
]);

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
