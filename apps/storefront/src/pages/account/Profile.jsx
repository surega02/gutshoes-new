import React, {useState} from "react";
import AccountShell from "../../components/layout/AccountShell";
import Button from "../../components/ui/Button";
import Feedback from "../../components/ui/Feedback";
import Icon from "../../components/ui/Icon";

function Profile({user, setUser, navigate, onLogout}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saved, setSaved] = useState("");
  const submit = (e) => {
    e.preventDefault();
    setUser({
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      updated: "22 Agustus 2026, 16.10 WIB",
    });
    setSaved("Perubahan profil tersimpan di sesi demo ini.");
  };
  return (
    <AccountShell
      active="profile"
      navigate={navigate}
      user={user}
      onLogout={onLogout}
    >
      <div className="account-title">
        <div>
          <h2>Profil</h2>
          <p>Informasi kontak untuk pembaruan dan pemenuhan pesanan.</p>
        </div>
        <span className="account-status">
          <Icon name="check" /> Terhubung ke Google · demo
        </span>
      </div>
      <form className="profile-form" onSubmit={submit}>
        <label>
          Nama lengkap
          <input
            required
            maxLength="100"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Email Google
          <input disabled value={user.email} />
          <small>Email adalah identitas utama dan tidak dapat diubah.</small>
        </label>
        <label>
          Nomor telepon
          <input
            required
            inputMode="tel"
            autoComplete="tel"
            pattern="[0-9+ -]{8,20}"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <div className="profile-meta">
          <span>
            Akun dibuat<strong>{user.created}</strong>
          </span>
          <span>
            Terakhir diperbarui<strong>{user.updated}</strong>
          </span>
        </div>
        <Feedback type="success">{saved}</Feedback>
        <Button type="submit">Simpan perubahan</Button>
      </form>
    </AccountShell>
  );
}

export default Profile;
