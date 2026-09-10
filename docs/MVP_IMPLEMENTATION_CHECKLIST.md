# Urutan Penyelesaian MVP GutShoes

Baseline: [audit 6 September 2026](MVP_READINESS_AUDIT_2026-09-06.md). Urutan disetujui pengguna; mulai dari keamanan dan alur transaksi. Checklist membedakan implementasi lokal dari verifikasi provider/produksi.

- [x] **1. Keamanan dan alur transaksi — implementasi lokal selesai, 7 September 2026**
  - [x] Ownership customer/admin atau token guest untuk pembayaran/pembatalan.
  - [x] Kunci checkout per pemilik, retry tanpa order ganda, audit cancellation.
  - [x] Cart customer berbasis sesi, pemulihan setelah reload, tanpa fallback checkout demo.
  - [x] Deadline order/payment/reservation sama; penutupan provider diverifikasi sebelum stok dilepas.
  - [x] Webhook terlambat/berulang, amount mismatch, expiry race, timeout, serta refund untuk review.
  - [x] Tes regresi backend, frontend, build/lint, serta catatan deployment.
- [ ] **2. Midtrans sandbox** — kredensial test, callback HTTPS, transaksi sukses/gagal/expiry, replay webhook, pemulihan intent uncertain dan refund per metode. Verifikasi kontrak HTTP dari tahap 1 terhadap sandbox nyata.
- [ ] **3. Agregator logistik test mode** — konfirmasi Biteship atau provider pilihan; mapping area, origin, berat per item, auth, layanan dinamis, tarif dan cakupan wilayah.
- [ ] **4. Lengkapi fitur MVP PRD** — profil, katalog/pagination/filter brand/terlaris/detail slug, ganti ukuran, diskon kategori/brand, gambar, customer detail, dashboard, audit, konfigurasi, email, pelacakan. Tentukan apakah fulfillment cukup input resi atau booking otomatis.
- [ ] **5. Staging/UAT** — MySQL + Redis, queue/scheduler, Google OAuth, SMTP, uji pembelian guest/customer/admin menyeluruh, konkurensi stok nyata, backup/restore dan monitoring.
- [ ] **6. Produksi** — setelah blocker dan UAT selesai, konfigurasi live, smoke test terkendali, observabilitas dan rencana rollback.

Tidak ada pembayaran/refund nyata atau pemesanan pengiriman yang diotorisasi oleh checklist ini. Integrasi sandbox akan dikerjakan pada tahap berikutnya.

Hasil tahap 1: [laporan keamanan dan transaksi](TRANSACTION_SAFETY_PHASE1.md). Tahap 2–6 belum selesai.

Pembaruan tahap 2, 7 September 2026: alat sandbox-check dan sandbox-recover serta regresi percobaan Snap tersedia. Kunci/callback publik dan uji provider nyata masih menunggu. Lihat [panduan sandbox](MIDTRANS_SANDBOX.md).
