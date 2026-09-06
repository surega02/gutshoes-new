import React from "react";
import Home from "../pages/Home";
import Catalog from "../pages/Catalog";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Payment from "../pages/Payment";
import GuestOrders from "../pages/GuestOrders";
import Tracking from "../pages/Tracking";
import Login from "../pages/account/Login";
import Profile from "../pages/account/Profile";
import Addresses from "../pages/account/Addresses";
import Orders from "../pages/account/Orders";
import OrderDetail from "../pages/account/OrderDetail";

export const storefrontRoutes = [
  {page: "home", path: "/", render: (c) => <Home navigate={c.navigate} openProduct={c.openProduct} products={c.products} loading={c.catalogLoading} error={c.catalogError} retry={c.loadCatalog} />},
  {page: "catalog", path: "/catalog", render: (c) => <Catalog query={c.query} setQuery={c.setQuery} openProduct={c.openProduct} initialFilter={c.pageData.filter} products={c.products} loading={c.catalogLoading} error={c.catalogError} retry={c.loadCatalog} />},
  {page: "product", path: "/product/:slug", render: (c) => <ProductDetail product={c.products.find((item) => item.slug === c.pageData.slug)} products={c.products} loading={c.catalogLoading} error={c.catalogError} retry={c.loadCatalog} addToCart={c.addToCart} navigate={c.navigate} />},
  {page: "cart", path: "/cart", render: (c) => <Cart cart={c.cart} updateQty={c.updateQty} removeItem={c.removeItem} navigate={c.navigate} cartSource={c.cartSource} cartLoading={c.cartLoading} cartError={c.cartError} cartActions={c.cartActions} retryCart={c.reloadCart} />},
  {page: "checkout", path: "/checkout", render: (c) => <Checkout cart={c.cart} navigate={c.navigate} createOrder={c.createOrder} user={c.user} addresses={c.addresses} guestCartToken={c.guestCartToken} cartSource={c.cartSource} ensureServerCart={c.ensureServerCart} />},
  {page: "payment", path: "/payment", render: (c) => <Payment order={c.order} navigate={c.navigate} />},
  {page: "guest-orders", path: "/guest-orders", render: (c) => <GuestOrders references={c.guestOrders} navigate={c.navigate} onOpenPayment={c.createOrder} onRemember={c.rememberGuestOrder} />},
  {page: "tracking", path: "/tracking", render: (c) => <Tracking order={c.order} navigate={c.navigate} user={c.user} onRemember={c.rememberGuestOrder} onOpenPayment={c.createOrder} />},
  {page: "login", path: "/login", render: (c) => c.user ? <Profile user={c.user} setUser={c.setUser} navigate={c.navigate} onLogout={c.logout} /> : <Login navigate={c.navigate} onLogin={c.login} returnTo={c.returnTo} />},
  {page: "profile", path: "/profile", protected: true, render: (c) => <Profile user={c.user} setUser={c.setUser} navigate={c.navigate} onLogout={c.logout} />},
  {page: "addresses", path: "/addresses", protected: true, render: (c) => <Addresses user={c.user} addresses={c.addresses} setAddresses={c.setAddresses} navigate={c.navigate} onLogout={c.logout} />},
  {page: "orders", path: "/orders", protected: true, render: (c) => <Orders user={c.user} order={c.order} navigate={c.navigate} onLogout={c.logout} />},
  {page: "order-detail", path: "/order-detail/:orderNumber", protected: true, render: (c) => <OrderDetail user={c.user} orderNumber={c.pageData.orderNumber} navigate={c.navigate} onLogout={c.logout} />},
];

export function getStorefrontRoute(page) {
  return storefrontRoutes.find((route) => route.page === page) || storefrontRoutes[0];
}

export function isProtectedStorefrontRoute(page) {
  return Boolean(getStorefrontRoute(page).protected);
}

export function renderStorefrontRoute(page, context) {
  const route = getStorefrontRoute(page);
  if (route.protected && !context.user) return null;
  return route.render(context);
}
