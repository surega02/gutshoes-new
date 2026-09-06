import React, {useEffect, useRef, useState} from "react";
import {api} from "./api";
import {forgetAdminSession} from "./lib/adminSession";
import logoGutShoes from "./assets/logo-gutshoes.png";
import {nav} from "./admin/config";
import Icon from "./admin/components/Icon";
import {getAdminRoute} from "./routes";

export default function AdminPanel({
  section = "dashboard",
  navigate,
  onStorefront,
}) {
  const [rail, setRail] = useState(false);
  const [orderCount, setOrderCount] = useState(null);
  const navRef = useRef(null);
  const activeRoute = getAdminRoute(section);
  const valid = activeRoute.section;
  const content = activeRoute.render({navigate});
  useEffect(() => {
    let active = true;
    const loadOrderCount = () =>
      api
        .dashboard()
        .then(({data}) => {
          if (!active) return;
          const orders = data?.orders || {};
          setOrderCount(
            Number(orders.pending_payment || 0) +
              Number(orders.paid || 0) +
              Number(orders.processing || 0),
          );
        })
        .catch(() => {});
    loadOrderCount();
    const interval = window.setInterval(loadOrderCount, 60000);
    window.addEventListener("focus", loadOrderCount);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadOrderCount);
    };
  }, []);
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return undefined;
    const keepActiveVisible = () => {
      const active = navElement.querySelector("button.active");
      if (navElement.scrollHeight <= navElement.clientHeight + 2) {
        navElement.scrollTop = 0;
      } else if (active) {
        const top = active.offsetTop;
        const bottom = top + active.offsetHeight;
        if (top < navElement.scrollTop) navElement.scrollTop = Math.max(0, top - 8);
        if (bottom > navElement.scrollTop + navElement.clientHeight) navElement.scrollTop = bottom - navElement.clientHeight + 8;
      }
    };
    keepActiveVisible();
    window.addEventListener("resize", keepActiveVisible);
    const observer = new ResizeObserver(keepActiveVisible);
    observer.observe(navElement);
    return () => {
      window.removeEventListener("resize", keepActiveVisible);
      observer.disconnect();
    };
  }, [valid]);
  return (
    <div className={`admin-app ${rail ? "rail-open" : ""}`}>
      <a className="skip-link" href="#admin-main">
        Lewati ke konten admin
      </a>
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <img src={logoGutShoes} alt="GutShoes" />
          <span>ADMIN</span>
        </div>
        <nav ref={navRef} aria-label="Navigasi admin">
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              aria-label={id === "orders" && orderCount ? `${label}, ${orderCount} perlu ditangani` : label}
              className={valid === id ? "active" : ""}
              aria-current={valid === id ? "page" : undefined}
              onClick={() => {
                navigate(id);
                setRail(false);
              }}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {id === "orders" && orderCount > 0 && (
                <b aria-hidden="true">{orderCount > 99 ? "99+" : orderCount}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="adm-sidebar-bottom">
          <button onClick={onStorefront}>
            <Icon name="external" />
            <span>Lihat storefront</span>
          </button>
          <div className="adm-admin">
            <span>AD</span>
            <div>
              <strong>Administrator</strong>
              <small>Sesi aktif</small>
            </div>
            <button
              className="adm-logout"
              onClick={async () => {
                forgetAdminSession();
                try {
                  await api.logout();
                } finally {
                  window.location.reload();
                }
              }}
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>
      {rail && (
        <button
          className="adm-scrim"
          onClick={() => setRail(false)}
          aria-label="Tutup menu"
        />
      )}
      <div className="adm-workspace">
        <header className="adm-topbar">
          <button
            className="adm-menu"
            onClick={() => setRail(true)}
            aria-label="Buka menu"
          >
            <Icon name="menu" />
          </button>
          <label>
            <Icon name="search" />
            <input placeholder="Cari pesanan, SKU, atau pelanggan" />
          </label>
          <div>
            <button
              aria-label="Buka pesanan yang perlu ditangani"
              className="adm-notification"
              onClick={() => navigate("orders")}
            >
              <Icon name="bell" />
              <span />
            </button>
            <span className="adm-live">
              <i /> Sistem normal
            </span>
          </div>
        </header>
        <main id="admin-main" tabIndex="-1">
          {content}
        </main>
      </div>
    </div>
  );
}




