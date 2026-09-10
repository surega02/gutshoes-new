const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");
const BACKEND_BASE = API_BASE.replace(/\/api\/v1$/, "");

export class ApiError extends Error {
  constructor(message, status, body, cause) {
    super(message, {cause});
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code;
    this.errors = body?.errors || {};
  }
}

export function isBackendUnavailable(error) {
  return (
    error instanceof ApiError && (error.status === 0 || error.status >= 500)
  );
}

function csrfToken() {
  const cookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith("XSRF-TOKEN="));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice("XSRF-TOKEN=".length));
  } catch {
    return cookie.slice("XSRF-TOKEN=".length);
  }
}

export async function csrf() {
  const response = await fetch(`${BACKEND_BASE}/sanctum/csrf-cookie`, {
    credentials: "include",
    signal: AbortSignal.timeout(20000),
    headers: {Accept: "application/json"},
  });
  if (!response.ok)
    throw new ApiError(
      "Sesi aman tidak dapat dimulai. Muat ulang halaman lalu coba lagi.",
      response.status,
      {},
    );
}

async function request(path, options = {}, retried = false) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = csrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
  }
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal || AbortSignal.timeout(20000),
      headers,
      credentials: "include",
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
    });
  } catch (error) {
    throw new ApiError(
      "Backend GutShoes belum dapat dijangkau. Periksa koneksi atau jalankan API Laravel.",
      0,
      {},
      error,
    );
  }
  const body =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (response.status === 419 && !retried) {
    await csrf();
    return request(path, options, true);
  }
  if (!response.ok)
    throw new ApiError(
      body?.message || "Permintaan tidak dapat diproses.",
      response.status,
      body,
    );
  return body;
}

export const googleLoginUrl = `${BACKEND_BASE}/api/v1/auth/google`;
export const api = {
  provinces: () => request("/regions/provinces"),
  regencies: (code) =>
    request("/regions/regencies?province_code=" + encodeURIComponent(code)),
  districts: (code) =>
    request("/regions/districts?regency_code=" + encodeURIComponent(code)),
  villages: (code) =>
    request("/regions/villages?district_code=" + encodeURIComponent(code)),
  catalog: (params) =>
    request(`/products?${new URLSearchParams(params).toString()}`),
  product: (slug) => request(`/products/${encodeURIComponent(slug)}`),
  me: () => request("/auth/me"),
  adminLogin: async (credentials) => {
    await csrf();
    return request("/admin/auth/login", {method: "POST", body: credentials});
  },
  logout: () => request("/auth/logout", {method: "POST"}),
  profile: () => request("/profile"),
  updateProfile: (data) => request("/profile", {method: "PUT", body: data}),
  addresses: () => request("/addresses"),
  createAddress: (data) => request("/addresses", {method: "POST", body: data}),
  updateAddress: (id, data) =>
    request(`/addresses/${id}`, {method: "PUT", body: data}),
  deleteAddress: (id) => request(`/addresses/${id}`, {method: "DELETE"}),
  orders: (params) =>
    request(`/orders?${new URLSearchParams(params).toString()}`),
  order: (number) => request(`/orders/${encodeURIComponent(number)}`),
  track: (data) => request("/orders/track", {method: "POST", body: data}),
  claimCart: (cartToken) => request("/cart/claim", {method: "POST", headers: {"X-Guest-Cart-Token": cartToken}}),
  cart: (cartToken) =>
    request("/cart", {
      headers: cartToken ? {"X-Guest-Cart-Token": cartToken} : {},
    }),
  addCartItem: (variantId, quantity, cartToken) =>
    request("/cart/items", {
      method: "POST",
      headers: cartToken ? {"X-Guest-Cart-Token": cartToken} : {},
      body: {variant_id: variantId, quantity},
    }),
  updateCartItem: (id, quantity, cartToken) =>
    request(`/cart/items/${id}`, {
      method: "PATCH",
      headers: cartToken ? {"X-Guest-Cart-Token": cartToken} : {},
      body: {quantity},
    }),
  deleteCartItem: (id, cartToken) =>
    request(`/cart/items/${id}`, {
      method: "DELETE",
      headers: cartToken ? {"X-Guest-Cart-Token": cartToken} : {},
    }),
  quote: (data, cartToken) =>
    request("/checkout/quote", {
      method: "POST",
      headers: cartToken ? {"X-Guest-Cart-Token": cartToken} : {},
      body: data,
    }),
  checkout: (data, cartToken, key) =>
    request("/orders", {
      method: "POST",
      headers: {...(cartToken ? {"X-Guest-Cart-Token": cartToken} : {}), "Idempotency-Key": key},
      body: data,
    }),
  guestOrder: (number, token) =>
    request("/guest/orders/" + encodeURIComponent(number), {
      headers: {"X-Guest-Order-Token": token},
    }),
  createGuestPayment: (number, token) =>
    request("/guest/orders/" + encodeURIComponent(number) + "/payment", {
      method: "POST",
      headers: {"X-Guest-Order-Token": token},
    }),
  createCustomerPayment: (number, email) =>
    request("/orders/" + encodeURIComponent(number) + "/payment", {
      method: "POST",
      body: {email},
    }),
  cancel: (number, data, key, guestToken) =>
    request(`/orders/${encodeURIComponent(number)}/cancel`, {
      method: "POST",
      headers: {"Idempotency-Key": key, ...(guestToken ? {"X-Guest-Order-Token": guestToken} : {})},
      body: data,
    }),
  dashboard: () => request("/admin/dashboard"),
  adminOrders: (params) =>
    request(`/admin/orders?${new URLSearchParams(params).toString()}`),
  adminOrder: (id) => request(`/admin/orders/${id}`),
  inventories: (params) =>
    request(`/admin/inventories?${new URLSearchParams(params).toString()}`),
  inventoryOptions: () => request("/admin/inventory-options"),
  createInventory: (data) =>
    request("/admin/inventories", {method: "POST", body: data}),
  inventoryMovements: (id) =>
    request(`/admin/inventories/${id}/movements`),
  deleteInventory: (id) =>
    request(`/admin/inventories/${id}`, {method: "DELETE"}),
  adminCustomers: (params) =>
    request(`/admin/customers?${new URLSearchParams(params).toString()}`),
  adminPromotions: (params) =>
    request(`/admin/promotions?${new URLSearchParams(params).toString()}`),
  adminVouchers: (params) =>
    request(`/admin/vouchers?${new URLSearchParams(params).toString()}`),
  adminConfigurations: () => request("/admin/configurations"),
  adminAuditLogs: (params) =>
    request(`/admin/audit-logs?${new URLSearchParams(params).toString()}`),
  adminBrands: () => request("/admin/brands"),
  createBrand: (data) => request("/admin/brands", {method: "POST", body: data}),
  updateBrand: (id, data) =>
    request(`/admin/brands/${id}`, {method: "PUT", body: data}),
  deleteBrand: (id) => request(`/admin/brands/${id}`, {method: "DELETE"}),
  adminCategories: () => request("/admin/categories"),
  createCategory: (data) =>
    request("/admin/categories", {method: "POST", body: data}),
  updateCategory: (id, data) =>
    request(`/admin/categories/${id}`, {method: "PUT", body: data}),
  deleteCategory: (id) =>
    request(`/admin/categories/${id}`, {method: "DELETE"}),
  adminSizes: () => request("/admin/sizes"),
  adminProducts: (params) =>
    request(`/admin/products?${new URLSearchParams(params).toString()}`),
  adminProduct: (id) => request(`/admin/products/${id}`),
  createProduct: (data) =>
    request("/admin/products", {method: "POST", body: data}),
  updateProduct: (id, data) =>
    request(`/admin/products/${id}`, {method: "PUT", body: data}),
  deleteProduct: (id) => request(`/admin/products/${id}`, {method: "DELETE"}),
  publishProduct: (id) =>
    request(`/admin/products/${id}/publish`, {method: "POST"}),
  uploadProductImage: (id, data) =>
    request(`/admin/products/${id}/images`, {method: "POST", body: data}),
  deleteProductImage: (id, imageId) =>
    request(`/admin/products/${id}/images/${imageId}`, {method: "DELETE"}),
  adjustInventory: (id, data) =>
    request(`/admin/inventories/${id}/adjust`, {method: "PATCH", body: data}),
  fulfillOrder: (id, data) =>
    request(`/admin/orders/${id}/fulfillment`, {method: "PATCH", body: data}),
  updateConfiguration: (key, data) =>
    request(`/admin/configurations/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: data,
    }),
};
