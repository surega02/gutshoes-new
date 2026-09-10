import React, {useState} from "react";
import Icon from "../ui/Icon";
import ConfirmDialog from "../ui/ConfirmDialog";

function AccountShell({active, navigate, user, children, onLogout}) {
  const [confirming, setConfirming] = useState(false);
  const tabs = [
    ["profile", "Profil"],
    ["addresses", "Alamat"],
    ["orders", "Pesanan"],
  ];
  return (
    <main className="account-page">
      <ConfirmDialog
        open={confirming}
        title="Keluar dari akun?"
        description="Kamu perlu masuk kembali untuk membuka pesanan dan keranjang akunmu."
        confirmLabel="Ya, keluar"
        onCancel={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); onLogout(); }}
      />
      <header className="account-head">
        <div className="profile-avatar" aria-hidden="true">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1>Halo, {user.name.split(" ")[0]}</h1>
          <p>{user.email}</p>
        </div>
      </header>
      <div className="account-layout">
        <aside className="account-nav" aria-label="Menu akun">
          {tabs.map(([page, label]) => (
            <button
              key={page}
              className={active === page ? "active" : ""}
              aria-current={active === page ? "page" : undefined}
              onClick={() => navigate(page)}
            >
              {label}
              <Icon name="chevron" />
            </button>
          ))}
          <button className="logout-link" onClick={() => setConfirming(true)}>
            Keluar
          </button>
        </aside>
        <section className="account-content">{children}</section>
      </div>
    </main>
  );
}

export default AccountShell;
