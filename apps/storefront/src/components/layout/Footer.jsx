import React from "react";
import logoGutShoes from "../../assets/logo-gutshoes.png";

function Footer() {
  return (
    <footer>
      <div>
        <img src={logoGutShoes} alt="GutShoes" />
        <p>
          Sepatu olahraga dengan informasi harga dan ukuran yang mudah dipahami.
        </p>
      </div>
      <div>
        <strong>Belanja</strong>
        <a href="#catalog">Semua sepatu</a>
        <a href="#catalog?filter=Lari">Lari</a>
        <a href="#catalog?filter=Training">Training</a>
      </div>
      <div>
        <strong>Bantuan</strong>
        <a href="#guest-orders">Pesanan terakhir saya</a>
        <a href="#tracking">Lacak dengan nomor order</a>
        <span
          className="footer-pending"
          aria-disabled="true"
          title="Tersedia setelah backend layanan pelanggan terhubung"
        >
          Pembatalan & refund · segera
        </span>
        <span
          className="footer-pending"
          aria-disabled="true"
          title="Tersedia setelah kanal layanan pelanggan terhubung"
        >
          Hubungi kami · segera
        </span>
      </div>
      <div>
        <strong>Catatan</strong>
        <p>
          Konten produk dan transaksi pada prototipe ini bersifat demonstrasi.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
