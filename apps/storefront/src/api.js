const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const BACKEND_BASE = API_BASE.replace(/\/api\/v1$/, '');

export class ApiError extends Error {
  constructor(message, status, body) { super(message); this.name='ApiError'; this.status=status; this.code=body?.code; this.errors=body?.errors || {}; }
}

async function request(path, options={}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type','application/json');
  headers.set('Accept','application/json');
  const response = await fetch(`${API_BASE}${path}`, {...options, headers, credentials:'include', body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined});
  const body = response.status === 204 ? null : await response.json().catch(()=>null);
  if (!response.ok) throw new ApiError(body?.message || 'Permintaan tidak dapat diproses.', response.status, body);
  return body;
}

export const googleLoginUrl = `${BACKEND_BASE}/api/v1/auth/google`;
export async function csrf() { await fetch(`${BACKEND_BASE}/sanctum/csrf-cookie`, {credentials:'include'}); }
export const api = {
  catalog: params => request(`/products?${new URLSearchParams(params).toString()}`),
  product: slug => request(`/products/${encodeURIComponent(slug)}`),
  me: () => request('/auth/me'),
  adminLogin: async credentials => { await csrf(); return request('/admin/auth/login',{method:'POST',body:credentials}); },
  logout: () => request('/auth/logout',{method:'POST'}),
  profile: () => request('/profile'),
  updateProfile: data => request('/profile',{method:'PUT',body:data}),
  addresses: () => request('/addresses'),
  createAddress: data => request('/addresses',{method:'POST',body:data}),
  updateAddress: (id,data) => request(`/addresses/${id}`,{method:'PUT',body:data}),
  deleteAddress: id => request(`/addresses/${id}`,{method:'DELETE'}),
  orders: params => request(`/orders?${new URLSearchParams(params).toString()}`),
  order: number => request(`/orders/${encodeURIComponent(number)}`),
  track: data => request('/orders/track',{method:'POST',body:data}),
  checkout: (data, cartToken, key) => request('/orders',{method:'POST',headers:{'X-Guest-Cart-Token':cartToken,'Idempotency-Key':key},body:data}),
  createPayment: (number,email) => request('/orders/'+encodeURIComponent(number)+'/payment',{method:'POST',body:{email}}),
  cancel: (number,data,key) => request(`/orders/${encodeURIComponent(number)}/cancel`,{method:'POST',headers:{'Idempotency-Key':key},body:data}),
  dashboard: () => request('/admin/dashboard'),
  adminOrders: params => request(`/admin/orders?${new URLSearchParams(params).toString()}`),
  inventories: params => request(`/admin/inventories?${new URLSearchParams(params).toString()}`),
};
