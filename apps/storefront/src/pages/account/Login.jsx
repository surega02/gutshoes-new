import React, {useState} from "react";
import logoGutShoes from "../../assets/logo-gutshoes.png";
import Button from "../../components/ui/Button";
import Feedback from "../../components/ui/Feedback";
import Icon from "../../components/ui/Icon";

function LoginV2({navigate, onLogin, returnTo}) {
  const [status, setStatus] = useState("idle");
  const login = () => {
    setStatus("loading");
    onLogin(returnTo);
  };
  return (
    <main className="auth-login">
      <section className="login-copy">
        <button className="back-link" onClick={() => navigate("home")}>
          <Icon name="back" /> Kembali ke toko
        </button>
        <h1>Satu akun untuk langkah berikutnya.</h1>
        <p>
          Simpan alamat, lihat riwayat pesanan, dan lanjutkan belanja dengan
          data yang sudah dikenali.
        </p>
        <div className="auth-route" aria-hidden="true">
          <span>Temukan</span>
          <i />
          <span>Beli</span>
          <i />
          <strong>Ikuti</strong>
        </div>
      </section>
      <section className="login-panel" aria-labelledby="login-title">
        <img src={logoGutShoes} alt="" />
        <h2 id="login-title">Masuk ke GutShoes</h2>
        <p>
          Gunakan akun Google sebagai identitas utama. Email dari Google tidak
          dapat diubah di GutShoes.
        </p>
        <Feedback type="success">
          Login aman melalui Google OAuth. Kamu akan kembali ke GutShoes setelah
          verifikasi.
        </Feedback>
        <Feedback>
          {status === "error"
            ? "Koneksi simulasi gagal. Periksa jaringan lalu coba masuk kembali."
            : ""}
        </Feedback>
        <Button
          className="google-button"
          onClick={login}
          disabled={status === "loading"}
          aria-busy={status === "loading"}
        >
          <span className="google-mark" aria-hidden="true">
            G
          </span>
          {status === "loading"
            ? "Menghubungkan akun…"
            : "Lanjutkan dengan Google"}
        </Button>
        <button
          className="text-link login-error-demo"
          onClick={() => setStatus("error")}
        >
          Uji kondisi koneksi gagal
        </button>
        <small>Guest checkout tetap tersedia tanpa membuat akun.</small>
      </section>
    </main>
  );
}

export default LoginV2;
